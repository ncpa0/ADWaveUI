import {
  Attribute,
  CustomElement,
  Slotted,
  State,
  WcSlot,
} from "jsxte-wc";
import { cls } from "../../utils/cls";
import { Selector } from "gtk-css-web";
import { BaseElement } from "../../base-elements";
import "./selector.css";
import { getUid } from "../../utils/get-uid";

type Ref<T> = { current: T | null };

declare global {
  namespace JSXTE {
    interface DialogTagProps {
      oncancel?: (e: Event) => void;
    }
  }
}

const IS_MOBILE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

@CustomElement("adw-selector")
export class ADWaveSelector extends BaseElement {
  @Attribute()
  accessor placeholder: string | undefined = undefined;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean | undefined = undefined;

  @Attribute()
  accessor name: string | undefined = undefined;

  @Attribute()
  accessor form: string | undefined = undefined;

  @Attribute()
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
      },
      (s) => [s.isOpen],
    );

    this.effect(
      () => {
        if (!IS_MOBILE && this.isOpen) {
          const eventHandler = (event: MouseEvent) => {
            if (
              !this.optionsListElem.current?.contains(
                event.target as Node,
              )
            ) {
              this.isOpen = false;
            }
          };
          document.addEventListener("click", eventHandler);

          return () => {
            document.removeEventListener("click", eventHandler);
          };
        }
      },
      (s) => [s.isOpen],
    );
  }

  private focusSelf() {
    // @ts-expect-error
    this.querySelector(`.${Selector.selector}`)?.focus();
  }

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

  private handleClick = (e: MouseEvent) => {
    if (this.disabled) {
      return;
    }

    if (!this.isOpen) {
      this.dialogElem.current?.showModal();
      this.isOpen = !this.isOpen;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private handleDialogClick = (e: MouseEvent) => {
    // close the modal if the click is outside the dialog
    if (this.isOpen && this.dialogElem.current) {
      const dialog = this.dialogElem.current;
      if (!this.optionsListElem.current?.contains(e.target as Node)) {
        dialog.close();
        this.isOpen = false;
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  private handleOptionClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.target as HTMLButtonElement | undefined;
    const { option } = btn?.dataset ?? {};
    if (option) {
      const dialog = this.dialogElem.current;
      this.currentOption = option;
      dialog?.close();
      this.isOpen = false;
      this.focusSelf();
    }
  };

  private handleModalCancel = (e: Event) => {
    this.isOpen = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }

    switch (e.key) {
      case " ":
      case "Enter": {
        if (!this.isOpen) {
          this.dialogElem.current?.showModal();
          this.isOpen = true;
        } else {
          const target = e.target as HTMLElement;
          if ((target as HTMLElement).tagName === "BUTTON") {
            if (e.key === "Enter") target.click();
          } else {
            this.dialogElem.current?.close();
            this.isOpen = false;
          }
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "ArrowUp": {
        this.focusOption(-1);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "ArrowDown": {
        this.focusOption(+1);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "PageUp": {
        this.focusOption(-10);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "PageDown": {
        this.focusOption(+10);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "Home": {
        this.focusOption(-this.options.length);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "End": {
        this.focusOption(+this.options.length);
        e.preventDefault();
        e.stopPropagation();
        break;
      }
      case "Escape": {
        if (this.isOpen) {
          this.isOpen = false;
          this.focusSelf();
          e.preventDefault();
          e.stopPropagation();
        }
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
        name={this.name}
        form={this.form}
        disabled={this.disabled}
        aria-hidden="true"
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
}
