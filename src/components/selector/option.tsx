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
  .events({
    optionattributechanged: OptionAttributeChangeEvent,
    optioncontentchanged: OptionContentChangeEvent,
  })
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
        "optionattributechanged",
        "selected",
        selected.get(),
      );
    });

    wc.onChange([value], () => {
      wc.emitEvent(
        "optionattributechanged",
        "value",
        value.get(),
      );
    });

    wc.onChange([inert], () => {
      wc.emitEvent(
        "optionattributechanged",
        "inert",
        inert.get(),
      );
    });

    wc.onChildrenChange(() => {
      wc.emitEvent(
        "optioncontentchanged",
        value.get(),
        wc.method.getLabel(),
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
