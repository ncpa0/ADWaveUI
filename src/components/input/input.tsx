import { Input, Suggestions } from "adwavecss";
import {
  Attribute,
  CustomElement,
  ElementLifecycleEvent,
  State,
} from "jsxte-wc";
import { BaseElement } from "../../base-elements";
import "../../index.css";
import { cls } from "../../utils/cls";
import {
  CustomKeyboardEvent,
  CustomMouseEvent,
} from "../../utils/events";
import { forceClassName } from "../../utils/force-class-name";
import { fuzzyCmp } from "../../utils/fuzzy-search";
import { getUid } from "../../utils/get-uid";
import {
  preventDefault,
  stopEvent,
} from "../../utils/prevent-default";
import { AttributeBool, InputType } from "../../utils/types";
import "./input.css";

declare global {
  namespace JSX {
    interface AdwInputProps {
      class?: string;
      id?: string;
      slot?: string;
      style?: string;
      value?: string;
      disabled?: AttributeBool;
      name?: string;
      form?: string;
      type?: InputType;
      placeholder?: string;
      minlength?: number;
      maxlength?: number;
      errorlabel?: string;
      alertlabel?: string;
      suggestions?: string;
      suggestionsshowall?: AttributeBool;
      suggestionsorientation?: string;
      fuzzy?: AttributeBool;
      onChange?: (e: InputChangeEvent) => void;
      onchange?: string;
      onKeyDown?: (e: CustomKeyboardEvent<{}>) => void;
      onkeydown?: string;
      onInput?: (e: InputEvent) => void;
      oninput?: string;
      onBlur?: (e: FocusEvent) => void;
      onblur?: string;
      onFocus?: (e: FocusEvent) => void;
      onfocus?: string;
    }

    interface IntrinsicElements {
      "adw-input": AdwInputProps;
    }
  }
}

class InputChangeEvent extends CustomEvent<{ value?: string }> {
  constructor(value?: string) {
    super("change", {
      detail: {
        value,
      },
    });
  }
}

export type { InputChangeEvent };

@CustomElement("adw-input")
export class ADWaveInputElement extends BaseElement {
  @Attribute({ nullable: false })
  accessor value: string = "";

  @Attribute({ type: "boolean", nullable: false })
  accessor disabled: boolean = false;

  @Attribute({ nullable: true })
  accessor name: string | null = null;

  @Attribute({ nullable: true })
  accessor form: string | null = null;

  @Attribute({ nullable: true, default: "text" })
  accessor type: InputType = "text";

  @Attribute({ nullable: true })
  accessor placeholder: string | null = null;

  @Attribute({ type: "number", nullable: true })
  accessor minLength: number | null = null;

  @Attribute({ type: "number", nullable: true })
  accessor maxLength: number | null = null;

  @Attribute({ nullable: true })
  accessor errorLabel: string | null = null;

  @Attribute({ nullable: true })
  accessor alertLabel: string | null = null;

  @Attribute({ nullable: true })
  accessor suggestions: string | null = null;

  @Attribute({ type: "boolean", nullable: false })
  accessor suggestionsShowAll: boolean = false;

  @Attribute({ nullable: true, default: "down" })
  accessor suggestionsOrientation: string = "down";

  @Attribute({ type: "boolean", nullable: false })
  accessor fuzzy: boolean = false;

  @State()
  accessor availableOptions: string[] = [];

  @State()
  accessor selectedOption: number = 0;

  @State()
  accessor isSuggestionsOpen = false;

  private uid = getUid();
  private isInFocus = false;
  private hasChanged = false;

  constructor() {
    super();

    this.immediateEffect(
      () => {
        this.availableOptions = this.getMatchingOptions();
        this.selectedOption = 0;
      },
      (s) => [s.value, s.suggestions, s.suggestionsShowAll],
    );

    this.immediateEffect(
      () => {
        if (this.isSuggestionsOpen) {
          this.selectedOption = 0;
        }
      },
      (s) => [s.isSuggestionsOpen],
    );

    this.effect(
      () => {
        if (this.isSuggestionsOpen) {
          this.scrollActiveToView();
        }
      },
      (s) => [s.selectedOption],
    );

    this.effect(
      () => {
        if (this.isSuggestionsOpen) {
          this.scrollActiveToView(true);
        }
      },
      (s) => [s.isSuggestionsOpen],
    );

    this.effect(
      ({ isFirstMount }) => {
        if (isFirstMount) return;
        if (this.isInFocus) {
          this.hasChanged = true;
        } else {
          this.dispatchEvent(new InputChangeEvent(this.value));
        }
      },
      (s) => [s.value],
    );

    this.lifecycle.once(ElementLifecycleEvent.WillMount, () => {
      forceClassName(this, Input.wrapper);
    });
  }

  /**
   * Performs a simple search through options with the provided query,
   * if the option starts with the exact same string as the query, it
   * is considered a match.
   */
  private search(options: string[], query: string): string[] {
    const results: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      if (option.toLowerCase().startsWith(query)) {
        results.push(option);
      }
    }

    return results;
  }

  /**
   * Performs a fuzzy search through options with the provided query,
   * if the option is similar enough to the query, it is considered a
   * match.
   */
  private fuzzySearch(options: string[], query: string): string[] {
    const results: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      if (fuzzyCmp(query, option.toLowerCase())) {
        results.push(option);
      }
    }

    return results;
  }

  private getMatchingOptions(): string[] {
    if (this.suggestions == null) {
      return [];
    }

    let options = this.suggestions.split(";");

    if (this.suggestionsShowAll) {
      return options;
    }

    const value = this.value?.toLowerCase();

    if (value == null) {
      return options;
    }

    if (this.fuzzy) {
      return this.fuzzySearch(options, value);
    } else {
      return this.search(options, value);
    }
  }

  private lastScrollIntoView = 0;

  /** Scrolls into view the currently highlighted suggestion. */
  private scrollActiveToView(forceInstant = false) {
    const suggestions = this.querySelector(
      `.${Suggestions.suggestions}`,
    );

    if (suggestions == null) {
      return;
    }

    const activeOption = suggestions?.querySelector(
      `.${Suggestions.active}`,
    ) as HTMLElement;

    if (activeOption == null) {
      return;
    }

    const now = Date.now();

    /**
     * If the behavior is smooth and the arrow key is being held down,
     * the scrolling won't happen until the key is released.
     *
     * In order to have smooth scrolling when the key is tapped, but
     * also have instant scrolling when the key is held down, we check
     * the time difference between the last scroll and the current
     * scroll, and chose an appropriate behavior.
     */
    if (forceInstant || now - this.lastScrollIntoView <= 100) {
      activeOption.scrollIntoView({
        behavior: "instant",
        block: "nearest",
      });
    } else {
      activeOption.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    this.lastScrollIntoView = now;
  }

  private handleOptionClick = (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    const target = ev.target as HTMLElement;
    const idx = target.dataset.opt
      ? Number(target.dataset.opt)
      : undefined;
    const shouldContinue = this.dispatchEvent(
      new CustomMouseEvent(
        "optionclick",
        {
          option: idx ? this.availableOptions[idx] : "",
        },
        ev,
      ),
    );
    if (idx && shouldContinue) {
      this.value = this.availableOptions[idx] ?? "";
      this.isSuggestionsOpen = false;
    }
  };

  private handleInputChange = (ev: InputEvent) => {
    const inputElem = ev.target as HTMLInputElement;
    this.value = inputElem.value;
  };

  private highlightNextOption(offset = 1) {
    this.selectedOption = Math.max(0, this.selectedOption! - offset);
  }

  private highlightPreviousOption(offset = 1) {
    this.selectedOption = Math.min(
      this.availableOptions.length - 1,
      this.selectedOption! + offset,
    );
  }

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
    switch (ev.key) {
      case "ArrowUp":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightPreviousOption();
            } else {
              this.highlightNextOption();
            }
          }
        });
        break;
      case "ArrowDown":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightNextOption();
            } else {
              this.highlightPreviousOption();
            }
          }
        });
        break;
      case "PageUp":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightPreviousOption(8);
            } else {
              this.highlightNextOption(8);
            }
          }
        });
        break;
      case "PageDown":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightNextOption(8);
            } else {
              this.highlightPreviousOption(8);
            }
          }
        });
        break;
      case "Home":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightPreviousOption(
                this.availableOptions.length - 1,
              );
            } else {
              this.highlightNextOption(
                this.availableOptions.length - 1,
              );
            }
          }
        });
        break;
      case "End":
        ev.preventDefault();
        this.withCustomKeyEvent(ev, () => {
          if (this.isSuggestionsOpen) {
            if (this.suggestionsOrientation == "up") {
              this.highlightNextOption(
                this.availableOptions.length - 1,
              );
            } else {
              this.highlightPreviousOption(
                this.availableOptions.length - 1,
              );
            }
          }
        });
        break;
      case "Enter":
        this.withCustomKeyEvent(
          ev,
          () => {
            if (this.isSuggestionsOpen) {
              ev.preventDefault();
              const opt = this.availableOptions[this.selectedOption];
              if (opt) {
                this.value = opt;
                this.isSuggestionsOpen = false;
              }
            } else if (this.hasChanged) {
              this.hasChanged = false;
              this.dispatchEvent(new InputChangeEvent(this.value));
            }
          },
          () => {
            ev.preventDefault();
          },
        );
        break;
      case "Backspace":
        this.withCustomKeyEvent(
          ev,
          () => {
            this.isSuggestionsOpen = true;
          },
          () => {
            ev.preventDefault();
          },
        );
        break;
      case "Escape":
        this.withCustomKeyEvent(
          ev,
          () => {
            if (this.isSuggestionsOpen) {
              this.isSuggestionsOpen = false;
            }
          },
          () => {
            ev.preventDefault();
          },
        );
        break;
    }
  };

  private handleFocus = (ev: FocusEvent) => {
    this.isInFocus = true;
    if (this.availableOptions.length) {
      this.isSuggestionsOpen = true;
    }
  };

  private handleBlur = (ev: FocusEvent) => {
    this.isInFocus = false;
    this.isSuggestionsOpen = false;
    if (this.hasChanged) {
      this.hasChanged = false;
      this.dispatchEvent(new InputChangeEvent(this.value));
    }
  };

  private Suggestions = () => {
    const isHidden =
      this.suggestions == null ||
      this.availableOptions.length === 0 ||
      this.isSuggestionsOpen === false;

    const reversed = this.suggestionsOrientation == "up";

    const options = this.availableOptions.map((option, idx) => {
      const isActive = idx === this.selectedOption;
      return (
        <div
          data-opt={idx}
          class={cls({
            [Suggestions.option]: true,
            [Suggestions.active]: isActive,
          })}
          onclick={this.handleOptionClick}
          onmousedown={preventDefault}
          role="option"
        >
          <span
            data-opt={idx}
            class="text"
          >
            {option}
          </span>
        </div>
      );
    });

    if (reversed) {
      options.reverse();
    }

    return (
      <div
        id={this.uid}
        class={cls([
          {
            [Suggestions.suggestions]: true,
            "suggestions-options": true,
            _adw_hidden: isHidden,
          },
          this.suggestionsOrientation === "up"
            ? ["orientation-up", "top"]
            : "orientation-down",
        ])}
        role="listbox"
      >
        {options}
      </div>
    );
  };

  render() {
    return (
      <>
        <input
          class={cls({
            [Input.input]: true,
            [Input.disabled]: this.disabled,
          })}
          oninput={this.handleInputChange}
          onkeydown={this.handleKeyDown}
          onfocus={this.handleFocus}
          onblur={this.handleBlur}
          onchange={stopEvent}
          type={this.type}
          value={this.value ?? undefined}
          disabled={this.disabled}
          name={this.name ?? undefined}
          form={this.form ?? undefined}
          placeholder={this.placeholder ?? undefined}
          minlength={this.minLength ?? undefined}
          maxlength={this.maxLength ?? undefined}
          aria-placeholder={this.placeholder}
          aria-label={this.placeholder}
          aria-invalid={this.errorLabel != null}
          aria-haspopup="listbox"
          aria-expanded={this.isSuggestionsOpen}
          aria-controls={this.uid}
        ></input>
        <this.Suggestions />
      </>
    );
  }
}
