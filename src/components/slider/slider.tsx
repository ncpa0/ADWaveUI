import "../../base-elements";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Slider } from "adwavecss";
import { AttributesOf, customElement, EventNamesOf } from "wc_toolkit";
import { CustomKeyboardEvent, CustomPointerEvent } from "../../utils/events";
import { isLmb } from "../../utils/is-lmb";
import { changeWithStep, clamp, toPrecision } from "../../utils/math";
import { stopEvent } from "../../utils/prevent-default";
import "./styles.css";

const preventDefault = (e: Event) => {
  e.preventDefault();
  return false;
};

class AdwSliderChangeEvent extends Event {
  declare readonly type: "change";
  public readonly value: number;

  constructor(value: number) {
    super("change", {
      bubbles: true,
    });
    this.value = value;
  }
}

const { CustomElement } = customElement("adw-slider")
  .attributes({
    value: "number",
    min: "number",
    max: "number",
    /*
     * Determines by how much the value will be incremented or
     * decremented when the user interacts with the slider.
     *
     * @default 1
     */
    step: "number",
    /**
     * The number of decimal places to round the value to.
     *
     * @default 4
     */
    precision: "number",
    disabled: "boolean",
    name: "string",
    form: "string",
  })
  .events(["pointerdown", "change", "keydown"])
  .context(({ value, min, max }) => {
    const positions = sig.derive(
      value.signal,
      min.signal,
      max.signal,
      (value = 0, min = 0, max = 100) => {
        const percent = ((value - min) / (max - min)) * 100;

        return {
          progressRight: `${100 - percent}%`,
          thumbLeft: `calc(${percent}% - 0.3em)`,
        };
      },
    );

    return {
      isPressed: sig(false),
      positions,
    };
  })
  .methods((wc) => {
    const {
      attribute: {
        min,
        max,
        value,
        disabled,
        precision,
        step,
      },
      context,
    } = wc;

    value.onChange((v) => {
      v = v ?? 0;
      const maxV = max.get() ?? 100;
      const minV = min.get() ?? 0;

      if (v > maxV) {
        value.set(maxV);
      } else if (v < minV) {
        value.set(minV);
      }
    });

    const handlePointerEventUp = (event: PointerEvent) => {
      event.stopPropagation();
      context.isPressed.dispatch(false);
    };

    const handlePointerEventMove = (event: PointerEvent) => {
      event.stopPropagation();
      if (disabled.get()) return;

      if (context.isPressed.get()) {
        const minV = min.get() ?? 0;
        const maxV = max.get() ?? 100;

        const { left, width } = wc.thisElement.getBoundingClientRect();
        const percent = (event.clientX - left) / width;
        const tmpValue = changeWithStep(
          value.get() ?? 0,
          toPrecision(
            minV + percent * (maxV - minV),
            precision.get() ?? 4,
          ),
          step.get() ?? 1,
        );

        methods.setValue(tmpValue);
      }
    };

    const setValue = (v: number) => {
      value.set(v);
      wc.emitEvent(new AdwSliderChangeEvent(value.get() ?? 0));
    };

    const methods = {
      setValue(newValue: number) {
        newValue = clamp(newValue, min.get() ?? 0, max.get() ?? 100);

        if (newValue === value.get()) return;

        setValue(newValue);
      },

      focus() {
        // @ts-expect-error
        wc.thisElement.querySelector(`.${Slider.slider}`)?.focus();
      },

      _handlePointerDown(event: PointerEvent) {
        event.stopPropagation();

        wc.emitEvent(
          new CustomPointerEvent("pointerdown", {}, event),
        ).onCommit(() => {
          if (isLmb(event)) {
            context.isPressed.dispatch(true);
            handlePointerEventMove(event);
          }
        });
      },

      _handleKeyDown(event: KeyboardEvent) {
        if (disabled.get()) return;

        switch (event.key) {
          case "ArrowLeft":
            event.stopPropagation();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                this.setValue((value.get() ?? 0) - (step.get() ?? 1));
              });
            break;
          case "ArrowRight":
            event.stopPropagation();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                this.setValue((value.get() ?? 0) + (step.get() ?? 1));
              });
            break;
        }
      },

      _handlePointerEventUp: handlePointerEventUp,
      _handlePointerEventMove: handlePointerEventMove,
    };

    return methods;
  })
  .connected((wc) => {
    const {
      method,
      attribute: {
        disabled,
        min,
        max,
        value,
        form,
        step,
        name,
      },
    } = wc;

    wc.listenWindow("pointerup", method._handlePointerEventUp);
    wc.listenWindow("pointermove", method._handlePointerEventMove);

    wc.attach(
      <div
        draggable={false}
        class={{
          [Slider.slider]: true,
          [Slider.disabled]: disabled.signal,
        }}
        onpointerdown={method._handlePointerDown}
        onpointermove={preventDefault}
        ondrag={preventDefault}
        onkeydown={method._handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={min.signal}
        aria-valuemax={max.signal}
        aria-valuenow={value.signal}
        aria-disabled={disabled}
      >
        <div
          draggable={false}
          class={Slider.track}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        >
        </div>
        <div
          draggable={false}
          class={Slider.progress}
          onpointermove={preventDefault}
          ondrag={preventDefault}
          style={{
            right: wc.context.positions.derive(p => p.progressRight),
          }}
        >
        </div>
        <div
          draggable={false}
          class={Slider.thumb}
          onpointermove={preventDefault}
          ondrag={preventDefault}
          style={{
            left: wc.context.positions.derive(p => p.thumbLeft),
          }}
        >
        </div>
        <input
          type="range"
          class="_adw_hidden"
          disabled={disabled.signal}
          name={name.signal}
          attribute:form={form.signal}
          min={min.signal.derive(String)}
          max={max.signal.derive(String)}
          step={step.signal.derive(String)}
          value={value.signal}
          onchange={stopEvent}
          aria-hidden="true"
        />
      </div>,
    );
  })
  .register();

const AdwSlider = CustomElement;
type AdwSlider = InstanceType<typeof CustomElement>;

type AdwSliderAttributes = AttributesOf<typeof AdwSlider>;
type AdwSliderEvents = EventNamesOf<typeof AdwSlider>;

export { AdwSlider };
export type { AdwSliderAttributes, AdwSliderChangeEvent, AdwSliderEvents };
