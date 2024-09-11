import type { AdwSelectorOption, AdwSelectorOptionAttributes } from "./option";

export class AdwSelectorChangeEvent extends Event {
  declare readonly type: "change";
  public readonly value: string | null;

  constructor(value: string | null) {
    super("change", {
      bubbles: true,
    });
    this.value = value;
  }
}

export class OptionContentChangeEvent extends Event {
  static readonly EVNAME = "optioncontentchanged";

  declare readonly target: AdwSelectorOption;
  declare readonly type: typeof OptionContentChangeEvent.EVNAME;
  readonly optionValue: string | null;
  readonly content: string | null;

  constructor(value: string | null, content: string | null) {
    super(OptionContentChangeEvent.EVNAME, {
      bubbles: true,
    });
    this.optionValue = value;
    this.content = content;
  }
}

export class OptionAttributeChangeEvent extends Event {
  static readonly EVNAME = "optionattributechanged";

  declare readonly target: AdwSelectorOption;
  declare readonly type: typeof OptionAttributeChangeEvent.EVNAME;
  readonly attributeName: keyof AdwSelectorOptionAttributes;
  readonly attributeValue: any;

  constructor(
    attributeName: keyof AdwSelectorOptionAttributes,
    attributeValue: any,
  ) {
    super(OptionAttributeChangeEvent.EVNAME, {
      bubbles: true,
    });
    this.attributeName = attributeName;
    this.attributeValue = attributeValue;
  }
}
