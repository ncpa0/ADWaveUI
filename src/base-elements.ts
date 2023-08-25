import {
  Element,
  ElementAttributeDidChangeEvent,
  ElementLifecycleEvent,
  ElementStateDidChangeEvent,
} from "jsxte-wc";

export type Dependency<T> = {
  getValue: () => T;
  name: string;
};

export abstract class BaseElement extends Element {
  private _dependencySelector = new Proxy(
    {},
    {
      get: (_, prop) => {
        return {
          getValue: () => (this as any)[prop],
          name: prop as string,
        };
      },
    },
  ) as any;

  /**
   * Registers a callback that will be ran on every change of the
   * specified dependencies (attribute or state).
   *
   * This effect always happens after the DOM has been updated.
   *
   * @returns A `stop` function that cancels the effect.
   */
  public effect<E extends BaseElement>(
    this: E,
    callback: Function,
    getDependencies: (select: {
      [K in keyof Omit<E, keyof BaseElement | "render">]: Dependency<
        E[K]
      >;
    }) => Dependency<any>[] | void,
  ): () => void {
    const deps = getDependencies(this._dependencySelector);

    if (!deps) {
      const updateHandler = () => callback;
      this.lifecycle.on(
        ElementLifecycleEvent.DidUpdate,
        updateHandler,
      );
      return () => {
        this.lifecycle.off(
          ElementLifecycleEvent.DidUpdate,
          updateHandler,
        );
      };
    }

    if (deps.length === 0) {
      const updateHandler = () => callback;
      this.lifecycle.once(
        ElementLifecycleEvent.DidMount,
        updateHandler,
      );
      return () => {
        this.lifecycle.off(
          ElementLifecycleEvent.DidMount,
          updateHandler,
        );
      };
    }

    const depNamesForAttr = deps.map((d) => d.name.toLowerCase());
    const depNamesForState = deps.map((d) => d.name);

    let runCallbackOnNextUpdate = false;

    const attribChangeHandler = (
      ev: ElementAttributeDidChangeEvent,
    ) => {
      if (depNamesForAttr.includes(ev.detail.attributeName)) {
        runCallbackOnNextUpdate = true;
      }
    };

    const stateChangeHandler = (ev: ElementStateDidChangeEvent) => {
      if (depNamesForState.includes(ev.detail.stateName)) {
        runCallbackOnNextUpdate = true;
      }
    };

    const didUpdateHandler = () => {
      if (runCallbackOnNextUpdate) {
        runCallbackOnNextUpdate = false;
        queueMicrotask(() => callback());
      }
    };

    this.lifecycle.on(
      ElementLifecycleEvent.AttributeDidChange,
      attribChangeHandler,
    );
    this.lifecycle.on(
      ElementLifecycleEvent.StateDidChange,
      stateChangeHandler,
    );
    this.lifecycle.on(
      ElementLifecycleEvent.DidUpdate,
      didUpdateHandler,
    );

    const stop = (): void => {
      this.lifecycle.off(
        ElementLifecycleEvent.AttributeDidChange,
        attribChangeHandler,
      );
      this.lifecycle.off(
        ElementLifecycleEvent.StateDidChange,
        stateChangeHandler,
      );
      this.lifecycle.off(
        ElementLifecycleEvent.DidUpdate,
        didUpdateHandler,
      );
    };

    return stop;
  }

  /**
   * Registers a callback that will be ran on every change of the
   * specified dependencies (attribute or state).
   *
   * This effect always happens right before the render, meaning that
   * state and attribute changes within it will affect the subsequent
   * render result and won't trigger another re-render.
   *
   * @returns A `stop` function that cancels the effect.
   */
  public immediateEffect<E extends BaseElement>(
    this: E,
    callback: Function,
    getDependencies: (select: {
      [K in keyof Omit<E, keyof BaseElement | "render">]: Dependency<
        E[K]
      >;
    }) => Dependency<any>[] | void,
  ): () => void {
    const deps = getDependencies(this._dependencySelector);

    if (!deps) {
      const updateHandler = () => callback;
      this.lifecycle.on(
        ElementLifecycleEvent.WillUpdate,
        updateHandler,
      );
      return () => {
        this.lifecycle.off(
          ElementLifecycleEvent.WillUpdate,
          updateHandler,
        );
      };
    }

    if (deps.length === 0) {
      const updateHandler = () => callback;
      this.lifecycle.once(
        ElementLifecycleEvent.DidMount,
        updateHandler,
      );
      return () => {
        this.lifecycle.off(
          ElementLifecycleEvent.DidMount,
          updateHandler,
        );
      };
    }

    const depNamesForAttr = deps.map((d) => d.name.toLowerCase());
    const depNamesForState = deps.map((d) => d.name);

    let runCallbackOnNextUpdate = false;

    const attribChangeHandler = (
      ev: ElementAttributeDidChangeEvent,
    ) => {
      if (depNamesForAttr.includes(ev.detail.attributeName)) {
        runCallbackOnNextUpdate = true;
      }
    };

    const stateChangeHandler = (ev: ElementStateDidChangeEvent) => {
      if (depNamesForState.includes(ev.detail.stateName)) {
        runCallbackOnNextUpdate = true;
      }
    };

    const didUpdateHandler = () => {
      if (runCallbackOnNextUpdate) {
        runCallbackOnNextUpdate = false;
        callback();
      }
    };

    this.lifecycle.on(
      ElementLifecycleEvent.AttributeDidChange,
      attribChangeHandler,
    );
    this.lifecycle.on(
      ElementLifecycleEvent.StateDidChange,
      stateChangeHandler,
    );
    this.lifecycle.on(
      ElementLifecycleEvent.WillUpdate,
      didUpdateHandler,
    );

    const stop = (): void => {
      this.lifecycle.off(
        ElementLifecycleEvent.AttributeDidChange,
        attribChangeHandler,
      );
      this.lifecycle.off(
        ElementLifecycleEvent.StateDidChange,
        stateChangeHandler,
      );
      this.lifecycle.off(
        ElementLifecycleEvent.WillUpdate,
        didUpdateHandler,
      );
    };

    return stop;
  }
}
