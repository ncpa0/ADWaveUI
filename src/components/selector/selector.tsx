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
import { CustomKeyboardEvent, CustomMouseEvent } from "../../utils/events";
import { getUid } from "../../utils/get-uid";
import { stopEvent } from "../../utils/prevent-default";
import { AttributeBool } from "../../utils/types";
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
      disabled?: AttributeBool;
      name?: string;
      form?: string;
      orientation?: "up" | "down";
      reverseorder?: AttributeBool;
      value?: string;
      children?: any;
      onChange?: (e: CustomEvent<{ value?: string }>) => void;
      onchange?: string;
      onClick?: (e: CustomMouseEvent<{}>) => void;
      onclick?: string;
    }

    interface AdwOptionProps {
      value?: string;
      selected?: AttributeBool;
      children?: string;
      /**
       * When set to true, this option will appear as non-selectable,
       * this can be used to create separators or headers above or in between other options.
       */
      inert?: AttributeBool;
    }

    interface IntrinsicElements {
      "adw-selector": AdwSelectorProps;
      "adw-option": AdwOptionProps;
    }
  }
}

const IS_MOBILE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const SEARCHABLE_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-[]\\{}|;':\",./<>?"
    .split("");

const FOCUS_CHANGE_EVENT_THROTTLE = 60;

class SelectorChangeEvent extends CustomEvent<{
  value: string | null;
}> {
  constructor(value: string | null) {
    super("change", {
      detail: {
        value,
      },
    });
  }
}

export type { SelectorChangeEvent };

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
  accessor orientation: "up" | "down" = "down";

  @Attribute({ type: "boolean", nullable: false, default: false })
  accessor reverseorder: boolean = false;

  @Attribute({ nullable: true })
  accessor value: string | null = null;

  @State()
  accessor isOpen: boolean = false;

  @Slotted({ filter: "adw-option" })
  accessor options: ADWaveSelectorOption[] = [];
  private selectableOptions: ADWaveSelectorOption[] = [];

  private uid = getUid();
  private dialogElem: Ref<HTMLDialogElement> = { current: null };
  private optionsListElem: Ref<HTMLDivElement> = { current: null };
  private searchInputMemory: string = "";
  private clearSearchInputMemoryTimeout?: number;

  constructor() {
    super();

    this.immediateEffect(() => {
      this.updateSelectableOptions();
    }, s => [s.options]);

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

            if (this.value != null) {
              this.scrollToOption(this.value);
            } else {
              optionsList.scrollTo({
                top: reverse ? optionsList.scrollHeight : 0,
                behavior: "instant",
              });
            }
          }

          /** When clicking outside of the visible modal, close it. */
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
        const firstSelected = this.selectableOptions.find((opt) =>
          opt.isSelected()
        );

        if (firstSelected) {
          this.value = firstSelected.getValue();

          for (let j = 0; j < this.selectableOptions.length; j++) {
            const slot = this.selectableOptions[j]!;

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
        const addedSlots = c.detail.changes.added as ADWaveSelectorOption[];
        const removedSlots = c.detail.changes.removed as ADWaveSelectorOption[];
        const changedSlots = c.detail.changes
          .attributeChanged as ADWaveSelectorOption[];

        for (let i = 0; i < removedSlots.length; i++) {
          const slot = removedSlots[i]!;
          if (slot.isSelected()) {
            hasChanged = true;
            this.value = null;
          }
        }

        for (let i = 0; i < changedSlots.length; i++) {
          const slot = changedSlots[i]!;
          if (slot.isSelected()) {
            const newValue = slot.getValue();
            hasChanged = this.value !== newValue;
            this.value = newValue;

            // unset the `selected` attribute on all other options
            for (let j = 0; j < this.selectableOptions.length; j++) {
              const otherSlot = this.selectableOptions[j]!;
              if (otherSlot !== slot) {
                otherSlot.setSelected(false);
              }
            }
            break;
          }
        }

        for (let i = 0; i < addedSlots.length; i++) {
          const slot = addedSlots[i]!;
          if (slot.isSelected()) {
            const newValue = slot.getValue();
            hasChanged = this.value !== newValue;
            this.value = newValue;

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

        this.updateSelectableOptions();

        if (hasChanged) {
          this.dispatchEvent(new SelectorChangeEvent(this.value));
        }
      }
    });
  }

  public toggleOpen() {
    if (!this.isOpen) {
      this.dialogElem.current?.showModal();
      this.isOpen = true;
    } else {
      this.dialogElem.current?.close();
      this.isOpen = false;
    }
  }

  private updateSelectableOptions() {
    this.selectableOptions = [];

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i]!;
      if (!option.inert) {
        this.selectableOptions.push(option);
      }
    }

    if (this.value != null) {
      if (this.getSelectedOption() === undefined) {
        this.value = null;
      }
    }
  }

  private tryInputSearch() {
    if (this.searchInputMemory.length === 0) return;
    const searchTerm = this.searchInputMemory.toLowerCase();

    let foundOpt = this.selectableOptions.find(opt => {
      const label = opt.getLabel().toLowerCase();
      return label.startsWith(searchTerm);
    });

    if (!foundOpt) {
      this.selectableOptions.find(opt => {
        const label = opt.getLabel().toLowerCase();
        return label.includes(searchTerm);
      });
    }

    if (foundOpt) {
      this.scrollToOption(foundOpt?.getValue(), "smooth");
    }
  }

  private scrollToOption(value: string, behavior: ScrollBehavior = "instant") {
    const optionsList = this.optionsListElem.current;

    if (!optionsList) {
      return;
    }

    const allOptElems = Array.from(
      optionsList.querySelectorAll("button.option"),
    ) as HTMLButtonElement[];

    const activeOptionElem = allOptElems.find(
      (btn) => btn.dataset.option === value,
    );

    if (activeOptionElem) {
      const optionsList = this.optionsListElem.current;
      optionsList?.scrollTo({
        top: activeOptionElem.offsetTop - (optionsList.clientHeight / 2),
        behavior,
      });
      activeOptionElem.focus();
    }
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

    let currentOption = options.querySelector(
      `.${Selector.option}:focus`,
    ) as HTMLButtonElement | undefined;

    if (!currentOption) {
      currentOption = options.querySelector(`.${Selector.option}.selected`) as
        | HTMLButtonElement
        | undefined;
    }

    if (!currentOption) {
      const reverse = this.orientation === "up";
      const firstOption = options.querySelector(
        reverse
          ? `.${Selector.option}:nth-last-child(1 of :not(.inert))`
          : `.${Selector.option}:nth-child(1 of :not(.inert))`,
      ) as HTMLButtonElement | undefined;
      firstOption?.focus();
      return;
    }

    let target = currentOption;

    const direction = offset > 0
      ? "nextElementSibling"
      : "previousElementSibling";
    mainloop: for (let i = 0; i < Math.abs(offset); i++) {
      let next = target[direction] as HTMLButtonElement | undefined;
      if (!next) {
        break;
      }
      while (next.classList.contains("inert")) {
        next = next[direction] as HTMLButtonElement | undefined;
        if (!next) {
          break mainloop;
        }
      }
      target = next!;
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

    for (let i = 0; i < this.selectableOptions.length; i++) {
      const option = this.selectableOptions[i]!;
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

    this.toggleOpen();
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

  private _lastFocusChange = 0;
  private withFocusChangeEvent(handler: () => void) {
    const now = Date.now();
    if (now - this._lastFocusChange > FOCUS_CHANGE_EVENT_THROTTLE) {
      this._lastFocusChange = now;
      handler();
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
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(-1);
          });
        });
        break;
      }
      case "ArrowDown": {
        ev.preventDefault();
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(+1);
          });
        });
        break;
      }
      case "PageUp": {
        ev.preventDefault();
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(-10);
          });
        });
        break;
      }
      case "PageDown": {
        ev.preventDefault();
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(+10);
          });
        });
        break;
      }
      case "Home": {
        ev.preventDefault();
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(-this.selectableOptions.length);
          });
        });
        break;
      }
      case "End": {
        ev.preventDefault();
        this.withFocusChangeEvent(() => {
          this.withCustomKeyEvent(ev, () => {
            this.focusOption(+this.selectableOptions.length);
          });
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
      default:
        if (SEARCHABLE_CHARS.includes(ev.key)) {
          this.searchInputMemory += ev.key;
          window.clearTimeout(this.clearSearchInputMemoryTimeout);
          this.clearSearchInputMemoryTimeout = window.setTimeout(() => {
            this.searchInputMemory = "";
          }, 1000);
          this.tryInputSearch();
        }
        break;
    }
  };

  private getSelectedOption() {
    return this.selectableOptions.find((option) =>
      option.isEqualTo(this.value)
    );
  }

  private Option = (props: { option: ADWaveSelectorOption }) => {
    const isSelected = props.option.isEqualTo(this.value);
    const isInert = props.option.inert;

    if (isInert) {
      return (
        <button
          class={cls([{
            [Selector.option]: true,
            inert: true,
          }, props.option.className])}
          role="presentation"
          onclick={stopEvent}
        >
          <span />
          <span class="opt-label">
            {props.option.getLabel()}
          </span>
          <span />
        </button>
      );
    }

    return (
      <button
        class={cls([{
          [Selector.option]: true,
          selected: isSelected,
        }, props.option.className])}
        onclick={this.handleOptionClick}
        data-option={props.option.getValue()}
        role="option"
        aria-selected={isSelected}
      >
        {props.option.getLabel()}
      </button>
    );
  };

  private OptionsListMobile = () => {
    let options = this.options;

    if (this.reverseorder) {
      options = options.slice().reverse();
    }

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
          {options.map((option) => <this.Option option={option} />)}
        </div>
      </dialog>
    );
  };

  private OptionsListDesktop = () => {
    let options = this.options;

    if (this.reverseorder) {
      options = options.slice().reverse();
    }

    return (
      <div
        id={this.uid}
        class={cls({
          [Selector.optionsList]: true,
          [Selector.top]: this.orientation === "up",
        })}
        ref={this.optionsListElem}
      >
        {options.map((option) => <this.Option option={option} />)}
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
        {this.selectableOptions.map((option, index) => {
          return (
            <option
              value={option.getValue()}
              selected={option.isEqualTo(this.value)}
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
        {IS_MOBILE ? <this.OptionsListMobile /> : <this.OptionsListDesktop />}
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

  get value() {
    return this.getValue();
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get inert() {
    return this.hasAttribute("inert");
  }

  set inert(inert: boolean) {
    this.toggleAttribute("inert", inert);
  }

  constructor() {
    super();
  }

  isEqualTo(value?: string | null) {
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
      switch (mutation.attributeName) {
        case "inert":
        case "value":
        case "class":
          return true;
        case "selected":
          if (mutation.oldValue !== this.getAttribute("selected")) {
            return true;
          }
          break;
      }
    }

    return false;
  }
}
