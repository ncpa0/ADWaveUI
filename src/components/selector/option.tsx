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
    /**
     * The value this option represents. When the option is selected,
     * this value gets assigned to the parent selector's `value` attribute.
     */
    value: "string",
    /**
     * When enabled, the option is rendered as a header and cannot
     * be selected.
     */
    header: "boolean",
    /**
     * Whether the option is currently selected. Managed by the parent
     * selector, but can be set initially to select the option by default.
     */
    selected: "boolean",
  })
  .events({
    optionattributechanged: OptionAttributeChangeEvent,
    optioncontentchanged: OptionContentChangeEvent,
  })
  .context()
  .methods((api) => {
    return {
      /**
       * Returns whether the option's value equals the given value.
       */
      isEqualTo(value?: string | null) {
        return this.hasValue() && this.getValue() === value;
      },

      /**
       * Returns whether the `value` attribute is set.
       */
      hasValue() {
        return api.attribute.value.get() !== null;
      },

      /**
       * Returns the option's value, or an empty string when unset.
       */
      getValue() {
        return api.attribute.value.get() ?? "";
      },

      /**
       * Returns the option's text content.
       */
      getLabel() {
        return api.thisElement.innerText;
      },

      /**
       * Selects or unselects the option, emitting an
       * `optionattributechanged` event.
       */
      setSelected(selected: boolean) {
        api.attribute.selected.set(selected);
      },

      /**
       * Returns whether the option is currently selected.
       */
      isSelected() {
        return !!api.attribute.selected.get();
      },
    };
  })
  .connected((wc) => {
    const { attribute: { selected, value, header } } = wc;

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

    wc.onChange([header], () => {
      wc.emitEvent(
        "optionattributechanged",
        "header",
        header.get(),
      );
    });

    let lastSeenContent = wc.method.getLabel();
    wc.onChildrenChange(() => {
      const currentLabel = wc.method.getLabel();

      if (currentLabel !== lastSeenContent) {
        lastSeenContent = currentLabel;
        wc.emitEvent(
          "optioncontentchanged",
          value.get(),
          currentLabel,
        );
      }
    });
  })
  .register();

export const AdwSelectorOption = CustomElement;
export type AdwSelectorOption = InstanceType<typeof CustomElement>;

export type AdwSelectorOptionAttributes = AttributesOf<
  typeof AdwSelectorOption
>;
export type AdwSelectorOptionEvents = EventNamesOf<typeof AdwSelectorOption>;
