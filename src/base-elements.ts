import {
  ReadonlySignal,
  sig,
  Signal,
  VSignal,
} from "@ncpa0cpl/vanilla-jsx/signals";
import { Attribute, registerDependencyHandler } from "wc_toolkit";

declare global {
  interface WcToolkitDependencies {
    signal: ReadonlySignal<any>;
  }
}

registerDependencyHandler<Signal<any>>({
  detect(v): v is Signal<any> {
    return v instanceof VSignal;
  },
  onChange(sig: Signal<any>, cb) {
    const cbRef = {
      current: () => {
        cbRef.current = cb;
      },
    };
    return sig.add(() => cbRef.current()).detach;
  },
});

declare module "wc_toolkit" {
  interface Attribute<K extends string, T> {
    signal: Signal<T | undefined>;
  }
}

Attribute.extend(Attr => {
  return class AttributeWithSignal<K extends string, T> extends Attr<K, T> {
    signal = sig<T>();

    protected override onCreatedCallback(): void {
      this.onChange(value => {
        if (typeof value === "function") {
          this.signal.dispatch(() => value);
          return;
        }
        this.signal.dispatch(value ?? undefined);
      });
    }
  };
});
