import {
  type AttributesOf,
  customElement,
  type EventNamesOf,
} from "wc_toolkit";
import { OptionAttributeChangeEvent, OptionContentChangeEvent } from "./events";

const { CustomElement } = customElement("adw-option", {
  noContent: true,
  observeSubtree: true,
})
  .attributes({
    value: "string",
    inert: "boolean",
    selected: "boolean",
  })
  .events([
    OptionAttributeChangeEvent.EVNAME,
    OptionContentChangeEvent.EVNAME,
  ])
  .context()
  .methods((api) => {
    return {
      isEqualTo(value?: string | null) {
        return this.hasValue() && this.getValue() === value;
      },

      hasValue() {
        return api.attribute.value.get() !== null;
      },

      getValue() {
        return api.attribute.value.get() ?? "";
      },

      getLabel() {
        return api.thisElement.innerText;
      },

      setSelected(selected: boolean) {
        api.attribute.selected.set(selected);
      },

      isSelected() {
        return !!api.attribute.selected.get();
      },
    };
  })
  .connected((wc) => {
    const { attribute: { selected, value, inert } } = wc;

    wc.onChange([selected], () => {
      wc.emitEvent(
        new OptionAttributeChangeEvent("selected", selected.get()),
      );
    });

    wc.onChange([value], () => {
      wc.emitEvent(
        new OptionAttributeChangeEvent("value", value.get()),
      );
    });

    wc.onChange([inert], () => {
      wc.emitEvent(
        new OptionAttributeChangeEvent("inert", inert.get()),
      );
    });

    wc.onChildrenChange(() => {
      wc.emitEvent(
        new OptionContentChangeEvent(value.get(), wc.method.getLabel()),
      );
    });
  })
  .register();

export const AdwSelectorOption = CustomElement;
export type AdwSelectorOption = InstanceType<typeof CustomElement>;

export type AdwSelectorOptionAttributes = AttributesOf<
  typeof AdwSelectorOption
>;
export type AdwSelectorOptionEvents = EventNamesOf<typeof AdwSelectorOption>;
