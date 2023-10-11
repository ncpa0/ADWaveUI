import { Suggestions, Input } from "gtk-css-web";
import {
  Attribute,
  CustomElement,
  ElementLifecycleEvent,
  State,
} from "jsxte-wc";
import { InputType } from "jsxte/dist/types/jsx/prop-types/input-jsx-props";
import { BaseElement } from "../../base-elements";
import { cls } from "../../utils/cls";
import { forceClassName } from "../../utils/force-class-name";
import { preventDefault } from "../../utils/prevent-default";
import "./input.css";
import { fuzzyCmp } from "../../utils/fuzzy-search";
import { getUid } from "../../utils/get-uid";

@CustomElement("adw-input")
export class ADWaveInputElement extends BaseElement {
  @Attribute()
  accessor inputValue: string | undefined = undefined;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean | undefined = undefined;

  @Attribute()
  accessor name: string | undefined = undefined;

  @Attribute()
  accessor form: string | undefined = undefined;

  @Attribute()
  accessor type: InputType = "text";

  @Attribute()
  accessor placeholder: string | undefined = undefined;

  @Attribute({ type: "number" })
  accessor minLength: number | undefined = undefined;

  @Attribute({ type: "number" })
  accessor maxLength: number | undefined = undefined;

  @Attribute()
  accessor errorLabel: string | undefined = undefined;

  @Attribute()
  accessor alertLabel: string | undefined = undefined;

  @Attribute()
  accessor suggestions: string | undefined = undefined;

  @Attribute({ type: "boolean" })
  accessor suggestionsShowAll: boolean = false;

  @Attribute()
  accessor suggestionsOrientation: string = "down";

  @Attribute({ type: "boolean" })
  accessor fuzzy: boolean = false;

  @State()
  accessor availableOptions: string[] = [];

  @State()
  accessor selectedOption: number = 0;

  @State()
  accessor isSuggestionsOpen = false;

  private uid = getUid();

  constructor() {
    super();

    this.lifecycle.once(ElementLifecycleEvent.WillMount, () => {
      forceClassName(this, Input.wrapper);
    });

    this.availableOptions = this.getMatchingOptions();

    this.immediateEffect(
      () => {
        this.availableOptions = this.getMatchingOptions();
        this.selectedOption = 0;
      },
      (s) => [s.inputValue, s.suggestions, s.suggestionsShowAll],
    );

    this.immediateEffect(
      () => {
        this.selectedOption = 0;
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
  }

  private search(options: string[], query: string): string[] {
    const results: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      if (option.startsWith(query)) {
        results.push(option);
      }
    }

    return results;
  }

  private fuzzySearch(options: string[], query: string): string[] {
    const results: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      if (fuzzyCmp(query, option)) {
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

    for (let i = 0; i < options.length; i++) {
      options[i] = options[i]!.toLowerCase();
    }

    if (this.suggestionsShowAll) {
      return options;
    }

    const value = this.inputValue?.toLowerCase();

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
  private scrollActiveToView() {
    const autocomplete = this.querySelector(
      `.${Suggestions.suggestions}`,
    );

    if (autocomplete == null) {
      return;
    }

    const activeOption = autocomplete?.querySelector(
      `.${Suggestions.active}`,
    ) as HTMLElement;

    if (activeOption == null) {
      return;
    }

    const autocompleteRect = autocomplete.getBoundingClientRect();
    const activeOptionRect = activeOption.getBoundingClientRect();

    if (
      activeOptionRect.top < autocompleteRect.top ||
      activeOptionRect.bottom > autocompleteRect.bottom
    ) {
      const now = Date.now();

      if (now - this.lastScrollIntoView > 100) {
        activeOption.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      } else {
        activeOption.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
      }

      this.lastScrollIntoView = now;
    }
  }

  private handleOptionClick = (ev: Event) => {
    ev.preventDefault();
    const target = ev.target as HTMLElement;
    const idx = target.dataset.opt;
    if (idx) {
      this.inputValue = this.availableOptions[parseInt(idx!)];
      this.isSuggestionsOpen = false;
    }
  };

  private handleChange = (ev: Event) => {
    const inputElem = ev.target as HTMLInputElement;
    this.inputValue = inputElem.value;
  };

  private selectNextOption(offset = 1) {
    this.selectedOption = Math.max(0, this.selectedOption! - offset);
  }

  private selectPreviousOption(offset = 1) {
    this.selectedOption = Math.min(
      this.availableOptions.length - 1,
      this.selectedOption! + offset,
    );
  }

  private handleKeyPress = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case "ArrowUp":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectPreviousOption();
          } else {
            this.selectNextOption();
          }
        }
        break;
      case "ArrowDown":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectNextOption();
          } else {
            this.selectPreviousOption();
          }
        }
        break;
      case "PageUp":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectPreviousOption(8);
          } else {
            this.selectNextOption(8);
          }
        }
        break;
      case "PageDown":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectNextOption(8);
          } else {
            this.selectPreviousOption(8);
          }
        }
        break;
      case "Home":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectPreviousOption(
              this.availableOptions.length - 1,
            );
          } else {
            this.selectNextOption(this.availableOptions.length - 1);
          }
        }
        break;
      case "End":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.selectNextOption(this.availableOptions.length - 1);
          } else {
            this.selectPreviousOption(
              this.availableOptions.length - 1,
            );
          }
        }
        break;
      case "Enter":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          const opt = this.availableOptions[this.selectedOption];
          if (opt) {
            this.inputValue = opt;
            this.isSuggestionsOpen = false;
          }
        }
        break;
      case "Backspace":
        this.isSuggestionsOpen = true;
        break;
      case "Escape":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          this.isSuggestionsOpen = false;
        }
        break;
    }
  };

  private handleFocus = () => {
    if (this.availableOptions.length) {
      this.isSuggestionsOpen = true;
    }
  };

  private handleBlur = () => {
    this.isSuggestionsOpen = false;
  };

  private Suggestions = () => {
    if (
      this.suggestions == null ||
      this.availableOptions.length === 0 ||
      this.isSuggestionsOpen === false
    ) {
      return <></>;
    }

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
          aria-selected={isActive}
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
          })}
          oninput={this.handleChange}
          onkeydown={this.handleKeyPress}
          onfocus={this.handleFocus}
          onblur={this.handleBlur}
          type={this.type}
          value={this.inputValue}
          disabled={this.disabled}
          name={this.name}
          form={this.form}
          placeholder={this.placeholder}
          minlength={this.minLength}
          maxlength={this.maxLength}
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
