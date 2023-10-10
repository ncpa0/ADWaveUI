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
  @Attribute({ type: "boolean" })
  accessor disabled: boolean | undefined = undefined;

  @Attribute()
  accessor name: string | undefined = undefined;

  @Attribute()
  accessor form: string | undefined = undefined;

  @State()
  accessor isOpen: boolean = false;

  @State()
  accessor currentOption: string | undefined = undefined;

  @Slotted()
  accessor slots: ADWaveSelectorOption[] = [];

  private dialogElem: Ref<HTMLDialogElement> = { current: null };
  private optionsListElem: Ref<HTMLDivElement> = { current: null };

  constructor() {
    super();

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
    }
  };

  private handleModalCancel = (e: Event) => {
    this.isOpen = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }

    if (e.key === " ") {
      if (!this.isOpen) {
        this.dialogElem.current?.showModal();
        this.isOpen = true;
      } else {
        this.dialogElem.current?.close();
        this.isOpen = false;
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private getSelectedOption() {
    return this.slots.find((option) =>
      option.isEqualTo(this.currentOption),
    );
  }

  private OptionsListMobile = () => {
    return (
      <dialog
        ref={this.dialogElem}
        onclick={this.handleDialogClick}
        oncancel={this.handleModalCancel}
      >
        <div
          class={cls([Selector.optionsList, Selector.noPosition])}
          ref={this.optionsListElem}
        >
          {this.slots.map((option, index) => {
            return (
              <button
                class={Selector.option}
                onclick={this.handleOptionClick}
                data-option={option.getValue()}
              >
                {option.getLabel()}
              </button>
            );
          })}
        </div>
      </dialog>
    );
  };

  private OptionsListDesktop = () => {
    return (
      <div
        class={Selector.optionsList}
        ref={this.optionsListElem}
      >
        {this.slots.map((option, index) => {
          return (
            <button
              class={Selector.option}
              onclick={this.handleOptionClick}
              data-option={option.getValue()}
            >
              {option.getLabel()}
            </button>
          );
        })}
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
      >
        {this.slots.map((option, index) => {
          return (
            <option
              value={option.getValue()}
              selected={option.isEqualTo(this.currentOption)}
            ></option>
          );
        })}
      </select>
    );
  };

  render() {
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
      >
        <span class={Selector.selectedOption}>
          {this.getSelectedOption()?.getLabel() ?? ""}
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
