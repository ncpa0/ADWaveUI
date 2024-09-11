import "../../base-elements";
import { Switch } from "adwavecss";
import "../../index.css";
import { AttributesOf, customElement, EventNamesOf } from "wc_toolkit";
import { CustomKeyboardEvent, CustomMouseEvent } from "../../utils/events";
import { stopEvent } from "../../utils/prevent-default";
import "./switch.css";

class AdwSwitchChangeEvent extends Event {
  declare readonly type: "change";
  public readonly active: boolean;

  constructor(active: boolean) {
    super("change", {
      bubbles: true,
    });
    this.active = active;
  }
}

const { CustomElement } = customElement("adw-switch")
  .attributes({
    active: "boolean",
    disabled: "boolean",
    name: "string",
    form: "string",
  })
  .events(["change", "click", "keydown"])
  .context()
  .methods(wc => {
    const { attribute: { active, disabled } } = wc;

    const setActiveValue = (v: boolean | undefined | null) => {
      v = !!v;
      active.set(v);
      wc.emitEvent(new AdwSwitchChangeEvent(v));
    };

    return {
      toggle() {
        setActiveValue(!active.get());
      },

      focus() {
        // @ts-expect-error
        wc.thisElement.querySelector(`.${Switch.switch}`)?.focus();
      },

      _handleClick(e: MouseEvent) {
        e.stopPropagation();
        const nextValue = !active.get();

        wc
          .emitEvent(new CustomMouseEvent("click", { nextValue }, e))
          .onCommit(() => {
            if (disabled.get()) return;
            setActiveValue(nextValue);
          });
      },

      _handleKeyDown(e: KeyboardEvent) {
        e.stopPropagation();

        wc
          .emitEvent(new CustomKeyboardEvent("keydown", {}, e))
          .onCommit(() => {
            if (disabled.get()) return;

            if (e.key === " " || e.key === "Enter") {
              const nextValue = !active.get();
              setActiveValue(nextValue);
            }
          });
      },
    };
  })
  .connected((wc) => {
    const { attribute, method } = wc;
    const { active, disabled, form, name } = attribute;

    wc.attach(
      <div
        class={{
          [Switch.switch]: true,
          [Switch.disabled]: disabled.signal,
          [Switch.active]: active.signal,
        }}
        onclick={method._handleClick}
        onkeydown={method._handleKeyDown}
        tabIndex={0}
        role="switch"
        aria-checked={active.signal}
        aria-disabled={disabled.signal}
      >
        <div class={Switch.knob}></div>
        <input
          type="checkbox"
          class="_adw_hidden"
          disabled={disabled.signal}
          checked={active.signal}
          name={name.signal}
          attribute:form={form.signal}
          onclick={method._handleClick}
          onchange={stopEvent}
          aria-hidden="true"
        />
      </div>,
    );
  })
  .register();

const AdwSwitch = CustomElement;
type AdwSwitch = InstanceType<typeof CustomElement>;

type AdwSwitchAttributes = AttributesOf<typeof AdwSwitch>;
type AdwSwitchEvents = EventNamesOf<typeof AdwSwitch>;

export { AdwSwitch };
export type { AdwSwitchAttributes, AdwSwitchChangeEvent, AdwSwitchEvents };
