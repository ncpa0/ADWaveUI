export class AdwSelectorChangeEvent extends Event {
  declare readonly type: "change";
  public readonly value: string | null;

  constructor(eventType: string, value: string | null) {
    super("change", {
      bubbles: true,
    });
    this.value = value;
  }
}

export class OptionContentChangeEvent extends Event {
  static readonly EVNAME = "optioncontentchanged";

  declare readonly type: typeof OptionContentChangeEvent.EVNAME;
  readonly optionValue: string | null;
  readonly content: string | null;

  constructor(
    eventType: string,
    value: string | null,
    content: string | null,
  ) {
    super(OptionContentChangeEvent.EVNAME, {
      bubbles: true,
    });
    this.optionValue = value;
    this.content = content;
  }
}

type SelectorAttributes = "value" | "inert" | "selected";

export class OptionAttributeChangeEvent extends Event {
  static readonly EVNAME = "optionattributechanged";

  declare readonly type: typeof OptionAttributeChangeEvent.EVNAME;
  readonly attributeName: SelectorAttributes;
  readonly attributeValue: any;

  constructor(
    eventType: string,
    attributeName: SelectorAttributes,
    attributeValue: any,
  ) {
    super(OptionAttributeChangeEvent.EVNAME, {
      bubbles: true,
    });
    this.attributeName = attributeName;
    this.attributeValue = attributeValue;
  }
}
