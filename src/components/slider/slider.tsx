import { Slider } from "adwavecss";
import { Attribute, CustomElement } from "jsxte-wc";
import { BaseElement } from "../../base-elements";
import "../../index.css";
import { cls } from "../../utils/cls";
import { CustomPointerEvent } from "../../utils/events";
import { changeWithStep, clamp, toPrecision } from "../../utils/math";
import { stopEvent } from "../../utils/prevent-default";
import { createRef } from "../../utils/ref";
import "./slider.css";

declare global {
  namespace JSX {
    interface AdwSliderProps {
      class?: string;
      id?: string;
      slot?: string;
      style?: string;
      value?: number;
      min?: number;
      max?: number;
      step?: number;
      precision?: number;
      disabled?: boolean;
      name?: string;
      form?: string;
      onChange?: (e: SliderChangeEvent) => void;
      onchange?: string;
      onPointerDown?: (e: CustomPointerEvent<{}>) => void;
      onpointerdown?: string;
    }

    interface IntrinsicElements {
      "adw-slider": AdwSliderProps;
    }
  }
}

const preventDefault = (e: Event) => e.preventDefault();

class SliderChangeEvent extends CustomEvent<{ value: number }> {
  constructor(value: number) {
    super("change", {
      bubbles: true,
      cancelable: true,
      detail: {
        value,
      },
    });
  }
}

@CustomElement("adw-slider")
export class ADWaveSliderElement extends BaseElement {
  @Attribute({ type: "number", nullable: false, default: 0 })
  accessor value: number = 0;

  @Attribute({ type: "number", nullable: false, default: 0 })
  accessor min: number = 0;

  @Attribute({ type: "number", nullable: false, default: 100 })
  accessor max: number = 100;

  @Attribute({ type: "number", nullable: false, default: 1 })
  accessor step: number = 1;

  @Attribute({ type: "number", nullable: false, default: 4 })
  accessor precision: number = 4;

  @Attribute({ type: "boolean", nullable: false, default: false })
  accessor disabled: boolean = false;

  @Attribute({ nullable: true })
  accessor name: string | null = null;

  @Attribute({ nullable: true })
  accessor form: string | null = null;

  private progress = createRef<HTMLDivElement>();
  private thumb = createRef<HTMLDivElement>();
  protected isPressed = false;

  constructor() {
    super();

    this.effect(
      () => {
        if (document) {
          window.addEventListener(
            "pointerup",
            this.handlePointerEventUp,
          );
          window.addEventListener(
            "pointermove",
            this.handlePointerEventMove,
          );
        }

        return () => {
          window.removeEventListener(
            "pointerup",
            this.handlePointerEventUp,
          );
          window.removeEventListener(
            "pointermove",
            this.handlePointerEventMove,
          );
        };
      },
      () => [],
    );

    this.effect(
      () => {
        this.moveThumb(this.value);
      },
      (s) => [s.value],
    );

    this.effect(
      ({ isFirstMount }) => {
        if (isFirstMount) return;
        this.dispatchEvent(new SliderChangeEvent(this.value));
      },
      (s) => [s.value],
    );
  }

  private setValue(newValue: number) {
    const value = clamp(newValue, this.min, this.max);

    if (this.value === value) return;

    this.value = value;
  }

  private moveThumb(value: number) {
    const percent =
      ((value - this.min) / (this.max - this.min)) * 100;

    this.progress.current!.style.right = `${100 - percent}%`;
    this.thumb.current!.style.left = `calc(${percent}% - 0.3em)`;
  }

  private handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();

    const shouldContinue = this.dispatchEvent(
      new CustomPointerEvent("pointerdown", {}, e),
    );

    if (!shouldContinue || this.disabled) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    this.isPressed = true;
    this.handlePointerEventMove(e);

    return false;
  };

  private handlePointerEventUp = (e: PointerEvent) => {
    e.stopPropagation();
    this.isPressed = false;
  };

  private handlePointerEventMove = (e: PointerEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    if (this.isPressed) {
      const { left, width } = this.getBoundingClientRect();
      const percent = (e.clientX - left) / width;
      const tmpValue = changeWithStep(
        this.value,
        toPrecision(
          this.min + percent * (this.max - this.min),
          this.precision,
        ),
        this.step,
      );

      this.setValue(tmpValue);
    }
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;

    switch (e.key) {
      case "ArrowLeft":
        this.setValue(this.value - this.step);
        break;
      case "ArrowRight":
        this.setValue(this.value + this.step);
        break;
    }
  };

  render() {
    return (
      <div
        draggable="false"
        class={cls({
          [Slider.slider]: true,
          [Slider.disabled]: this.disabled,
        })}
        onpointerdown={this.handlePointerDown}
        onpointermove={preventDefault}
        ondrag={preventDefault}
        onkeydown={this.handleKeyDown}
        tabindex="0"
        role="slider"
        aria-valuemin={this.min.toString()}
        aria-valuemax={this.max.toString()}
        aria-valuenow={this.value.toString()}
        aria-disabled={this.disabled ? "true" : "false"}
      >
        <div
          draggable="false"
          class={Slider.track}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <div
          ref={this.progress}
          draggable="false"
          class={Slider.progress}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <div
          ref={this.thumb}
          draggable="false"
          class={Slider.thumb}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <input
          type="range"
          class="_adw_hidden"
          disabled={this.disabled}
          name={this.name ?? undefined}
          form={this.form ?? undefined}
          min={this.min}
          max={this.max}
          step={this.step.toString()}
          value={this.value.toString()}
          onchange={stopEvent}
          aria-hidden="true"
        />
      </div>
    );
  }
}
