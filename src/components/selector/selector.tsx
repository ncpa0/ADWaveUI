import { Selector } from "adwavecss";
import {
  Attribute,
  CustomElement,
  ElementLifecycleEvent,
  Slotted,
  State,
  WcSlot,
} from "jsxte-wc";
import { BaseElement } from "../../base-elements";
import "../../index.css";
import { cls } from "../../utils/cls";
import {
  CustomKeyboardEvent,
  CustomMouseEvent,
} from "../../utils/events";
import { getUid } from "../../utils/get-uid";
import { stopEvent } from "../../utils/prevent-default";
import "./selector.css";

type Ref<T> = { current: T | null };

declare global {
  namespace JSXTE {
    interface DialogTagProps {
      oncancel?: (e: Event) => void;
    }
  }

  namespace JSX {
    interface AdwSelectorProps {
      class?: string;
      id?: string;
      slot?: string;
      style?: string;
      placeholder?: string;
      disabled?: boolean;
      name?: string;
      form?: string;
      orientation?: string;
      children?: any;
      onChange?: (e: CustomEvent<{ value?: string }>) => void;
      onchange?: string;
      onClick?: (e: CustomMouseEvent<{}>) => void;
      onclick?: string;
    }

    interface IntrinsicElements {
      "adw-selector": AdwSelectorProps;
    }
  }
}

const IS_MOBILE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

class SelectorChangeEvent extends CustomEvent<{ value?: string }> {
  constructor(value?: string) {
    super("change", {
      detail: {
        value,
      },
    });
  }
}

@CustomElement("adw-selector")
export class ADWaveSelector extends BaseElement {
  @Attribute({ nullable: true })
  accessor placeholder: string | null = null;

  @Attribute({ type: "boolean", nullable: false, default: false })
  accessor disabled: boolean = false;

  @Attribute({ nullable: true })
  accessor name: string | null = null;

  @Attribute({ nullable: true })
  accessor form: string | null = null;

  @Attribute({ nullable: false, default: "down" })
  accessor orientation: string = "down";

  @State()
  accessor isOpen: boolean = false;

  @State()
  accessor currentOption: string | undefined = undefined;

  @Slotted({ filter: "adw-option" })
  accessor options: ADWaveSelectorOption[] = [];

  private uid = getUid();
  private dialogElem: Ref<HTMLDialogElement> = { current: null };
  private optionsListElem: Ref<HTMLDivElement> = { current: null };

  constructor() {
    super();

    this.effect(
      () => {
        if (this.isOpen) {
          /**
           * When opening the selector, scroll into view to the first
           * option.
           */
          const optionsList = this.optionsListElem.current;
          if (optionsList) {
            const reverse = this.orientation === "up";
            if (reverse) {
              optionsList.scrollTo({
                top: optionsList.scrollHeight,
                behavior: "instant",
              });
            } else {
              optionsList.scrollTo({
                top: 0,
                behavior: "instant",
              });
            }
          }

          /**
           * When clicking outside of the visible modal, close it.
           */
          if (!IS_MOBILE) {
            const eventHandler = (event: MouseEvent) => {
              if (!this.contains(event.target as Node)) {
                this.isOpen = false;
                this.dialogElem.current?.close();
              }
            };
            document.addEventListener("click", eventHandler);

            return () => {
              document.removeEventListener("click", eventHandler);
            };
          }
        }
      },
      (s) => [s.isOpen],
    );

    this.effect(
      () => {
        const firstSelected = this.options.find((opt) =>
          opt.isSelected(),
        );

        if (firstSelected) {
          this.currentOption = firstSelected.getValue();

          for (let j = 0; j < this.options.length; j++) {
            const slot = this.options[j]!;

            if (slot !== firstSelected) {
              slot.setSelected(false);
            }
          }
        }
      },
      () => [],
    );

    /**
     * The list of <ADWaveSelectorOption> elements is the source of
     * truth for the selector. Whenever that list changes update the
     * currentOption to the first selected option.
     */
    this.lifecycle.on(ElementLifecycleEvent.SlotDidChange, (c) => {
      if (c.detail.slotName === "options") {
        let hasChanged = false;
        const changedSlots = c.detail.changes
          .attributeChanged as ADWaveSelectorOption[];

        for (let i = 0; i < changedSlots.length; i++) {
          const slot = changedSlots[i]!;
          if (slot.isSelected()) {
            const newValue = slot.getValue();
            hasChanged = this.currentOption !== newValue;
            this.currentOption = newValue;

            // unset the `selected` attribute on all other options
            for (let j = 0; j < this.options.length; j++) {
              const otherSlot = this.options[j]!;
              if (otherSlot !== slot) {
                otherSlot.setSelected(false);
              }
            }
            break;
          }
        }

        if (hasChanged) {
          this.dispatchEvent(
            new SelectorChangeEvent(this.currentOption),
          );
        }
      }
    });
  }

  private focusSelf() {
    // @ts-expect-error
    this.querySelector(`.${Selector.selector}`)?.focus();
  }

  /**
   * Selects the option that is offset from the currently focused
   * option. (e.g. focusOption(1) should select the option following
   * the currently focused one whereas focusOption(-2) should select
   * the second option that's behind the focused option)
   */
  private focusOption(offset: number) {
    const options = this.optionsListElem.current;

    if (!options) {
      return;
    }

    const currentOption = options.querySelector(
      `.${Selector.option}:focus`,
    ) as HTMLButtonElement | undefined;

    if (!currentOption) {
      if (this.isOpen) {
        const reverse = this.orientation === "up";
        const firstOption = options.querySelector(
          reverse
            ? `.${Selector.option}:last-child`
            : `.${Selector.option}:first-child`,
        ) as HTMLButtonElement | undefined;
        firstOption?.focus();
      }
      return;
    }

    let target = currentOption;

    const direction =
      offset > 0 ? "nextElementSibling" : "previousElementSibling";
    for (let i = 0; i < Math.abs(offset); i++) {
      const next = target[direction] as HTMLButtonElement | undefined;
      if (!next) {
        break;
      }
      target = next;
    }

    if (target) {
      target.focus();
    }
  }

  private select(optionValue?: string): boolean {
    if (optionValue == null) {
      return false;
    }

    let success = false;

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i]!;
      const isSelected = option.isEqualTo(optionValue);

      if (isSelected) {
        option.setSelected(true);
        success = true;
      }
    }

    return success;
  }

  private handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shouldContinue = this.dispatchEvent(
      new CustomMouseEvent(
        "click",
        {
          type: "selector",
        },
        e,
      ),
    );

    if (!shouldContinue || this.disabled) {
      return;
    }

    if (!this.isOpen) {
      this.dialogElem.current?.showModal();
      this.isOpen = true;
    } else {
      this.dialogElem.current?.close();
      this.isOpen = false;
    }
  };

  private handleDialogClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dialog = this.dialogElem.current;

    const shouldContinue = this.dispatchEvent(
      new CustomMouseEvent(
        "click",
        {
          type: "dialog",
        },
        e,
      ),
    );

    // close the modal if the click is outside the dialog
    if (this.isOpen && dialog && shouldContinue) {
      if (!this.optionsListElem.current?.contains(e.target as Node)) {
        dialog.close();
        this.isOpen = false;
      }
    }
  };

  private handleOptionClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.target as HTMLButtonElement | undefined;
    const { option: optValue } = btn?.dataset ?? {};

    const shouldContinue = this.dispatchEvent(
      new CustomMouseEvent(
        "click",
        {
          type: "option",
          option: optValue,
        },
        e,
      ),
    );

    if (!shouldContinue || this.disabled || optValue == null) {
      return;
    }

    const success = this.select(optValue);

    if (success) {
      const dialog = this.dialogElem.current;
      dialog?.close();
      this.isOpen = false;
      this.focusSelf();
    }
  };

  private handleModalCancel = (e: Event) => {
    this.isOpen = false;
  };

  private withCustomKeyEvent(
    ev: KeyboardEvent,
    cb: () => void,
    onCancel?: () => void,
  ) {
    ev.stopPropagation();

    const shouldContinue = this.dispatchEvent(
      new CustomKeyboardEvent("keydown", {}, ev),
    );

    if (shouldContinue) {
      cb();
    } else if (onCancel) {
      onCancel();
    }
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }

    switch (ev.key) {
      case " ":
      case "Enter": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (!this.isOpen) {
            this.dialogElem.current?.showModal();
            this.isOpen = true;
          } else {
            const target = ev.target as HTMLElement;
            if ((target as HTMLElement).tagName === "BUTTON") {
              if (ev.key === "Enter") target.click();
            } else {
              this.dialogElem.current?.close();
              this.isOpen = false;
            }
          }
        });
        break;
      }
      case "ArrowUp": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(-1);
        });
        break;
      }
      case "ArrowDown": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(+1);
        });
        break;
      }
      case "PageUp": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(-10);
        });
        break;
      }
      case "PageDown": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(+10);
        });
        break;
      }
      case "Home": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(-this.options.length);
        });
        break;
      }
      case "End": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          this.focusOption(+this.options.length);
        });
        break;
      }
      case "Escape": {
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isOpen) {
            this.isOpen = false;
            this.focusSelf();
          }
        });
        break;
      }
    }
  };

  private getSelectedOption() {
    return this.options.find((option) =>
      option.isEqualTo(this.currentOption),
    );
  }

  private Option = (props: { option: ADWaveSelectorOption }) => {
    return (
      <button
        class={Selector.option}
        onclick={this.handleOptionClick}
        data-option={props.option.getValue()}
        role="option"
        aria-selected={props.option.isEqualTo(this.currentOption)}
      >
        {props.option.getLabel()}
      </button>
    );
  };

  private OptionsListMobile = () => {
    return (
      <dialog
        ref={this.dialogElem}
        onclick={this.handleDialogClick}
        oncancel={this.handleModalCancel}
      >
        <div
          id={this.uid}
          class={cls([Selector.optionsList, Selector.noPosition])}
          ref={this.optionsListElem}
          role="listbox"
        >
          {this.options.map((option) => (
            <this.Option option={option} />
          ))}
        </div>
      </dialog>
    );
  };

  private OptionsListDesktop = () => {
    const reverse = this.orientation === "up";

    let options = this.options;

    if (reverse) {
      options = options.toReversed();
    }

    return (
      <div
        id={this.uid}
        class={cls({
          [Selector.optionsList]: true,
          [Selector.top]: reverse,
        })}
        ref={this.optionsListElem}
      >
        {options.map((option) => (
          <this.Option option={option} />
        ))}
      </div>
    );
  };

  private HiddenSelect = () => {
    return (
      <select
        class="_adw_hidden"
        name={this.name ?? undefined}
        form={this.form ?? undefined}
        disabled={this.disabled ?? undefined}
        aria-hidden="true"
        onchange={stopEvent}
      >
        {this.options.map((option, index) => {
          return (
            <option
              value={option.getValue()}
              selected={option.isEqualTo(this.currentOption)}
            />
          );
        })}
      </select>
    );
  };

  render() {
    const label = this.getSelectedOption()?.getLabel();
    return (
      <div
        class={cls({
          [Selector.selector]: true,
          [Selector.opened]: this.isOpen,
          [Selector.noPosition]: IS_MOBILE,
          [Selector.disabled]: this.disabled,
        })}
        onclick={this.handleClick}
        onkeydown={this.handleKeyDown}
        tabindex="0"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={this.isOpen}
        aria-controls={this.uid}
        aria-placeholder={this.placeholder}
      >
        <span
          class={cls({
            [Selector.selectedOption]: true,
            "with-placeholder": !label,
          })}
        >
          {label ? label : this.placeholder}
        </span>
        <span class={Selector.downButton}></span>
        {IS_MOBILE ? (
          <this.OptionsListMobile />
        ) : (
          <this.OptionsListDesktop />
        )}
        <this.HiddenSelect />
      </div>
    );
  }
}

@CustomElement("adw-option")
export class ADWaveSelectorOption extends WcSlot {
  get selected() {
    return this.isSelected();
  }

  set selected(selected: boolean) {
    this.setSelected(selected);
  }

  constructor() {
    super();
  }

  isEqualTo(value?: string) {
    return this.hasValue() && this.getValue() === value;
  }

  hasValue() {
    return this.hasAttribute("value");
  }

  getValue() {
    return this.getAttribute("value") ?? "";
  }

  getLabel() {
    return this.innerText;
  }

  setSelected(selected: boolean) {
    this.setAttribute("selected", selected.toString());
  }

  isSelected() {
    return this.getAttribute("selected") === "true";
  }

  protected override shouldEmitAttributeChangeEvent(
    mutations: MutationRecord[],
  ): boolean {
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i]!;
      if (
        mutation.attributeName === "selected" &&
        mutation.oldValue !== this.getAttribute("selected")
      ) {
        return true;
      }
    }

    return false;
  }
}
