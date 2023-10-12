import { Input, Suggestions } from "gtk-css-web";
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
import { fuzzyCmp } from "../../utils/fuzzy-search";
import { getUid } from "../../utils/get-uid";
import { preventDefault } from "../../utils/prevent-default";
import "./input.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "adw-input": {
        class?: string;
        id?: string;
        slot?: string;
        style?: string;
        value?: string;
        disabled?: boolean;
        name?: string;
        form?: string;
        type?: InputType;
        placeholder?: string;
        minlength?: number;
        maxlength?: number;
        errorlabel?: string;
        alertlabel?: string;
        suggestions?: string;
        suggestionsshowall?: boolean;
        suggestionsorientation?: string;
        fuzzy?: boolean;
      };
    }
  }
}

@CustomElement("adw-input")
export class ADWaveInputElement extends BaseElement {
  @Attribute()
  accessor value: string | undefined = undefined;

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

    this.availableOptions = this.getMatchingOptions();

    this.lifecycle.once(ElementLifecycleEvent.WillMount, () => {
      forceClassName(this, Input.wrapper);
    });

    this.immediateEffect(
      () => {
        this.availableOptions = this.getMatchingOptions();
        this.selectedOption = 0;
      },
      (s) => [s.value, s.suggestions, s.suggestionsShowAll],
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

  /**
   * Performs a simple search through options with the provided query,
   * if the option starts with the exact same string as the query, it
   * is considered a match.
   */
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

  /**
   * Performs a fuzzy search through options with the provided query,
   * if the option is similar enough to the query, it is considered a
   * match.
   */
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

  /**
   * Scrolls into view the currently highlighted suggestion.
   */
  private scrollActiveToView() {
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

    const autocompleteRect = suggestions.getBoundingClientRect();
    const activeOptionRect = activeOption.getBoundingClientRect();

    if (
      activeOptionRect.top < autocompleteRect.top ||
      activeOptionRect.bottom > autocompleteRect.bottom
    ) {
      const now = Date.now();

      /**
       * If the behavior is smooth and the arrow key is being held
       * down, the scrolling won't happen until the key is released.
       *
       * In order to have smooth scrolling when the key is tapped, but
       * also have instant scrolling when the key is held down, we
       * check the time difference between the last scroll and the
       * current scroll, and chose an appropriate behavior.
       */
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
      this.value = this.availableOptions[parseInt(idx!)];
      this.isSuggestionsOpen = false;
    }
  };

  private handleInputChange = (ev: Event) => {
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

  private handleKeyPress = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case "ArrowUp":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.highlightPreviousOption();
          } else {
            this.highlightNextOption();
          }
        }
        break;
      case "ArrowDown":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.highlightNextOption();
          } else {
            this.highlightPreviousOption();
          }
        }
        break;
      case "PageUp":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.highlightPreviousOption(8);
          } else {
            this.highlightNextOption(8);
          }
        }
        break;
      case "PageDown":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          if (this.suggestionsOrientation == "up") {
            this.highlightNextOption(8);
          } else {
            this.highlightPreviousOption(8);
          }
        }
        break;
      case "Home":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
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
        break;
      case "End":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
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
        break;
      case "Enter":
        if (this.isSuggestionsOpen) {
          ev.preventDefault();
          const opt = this.availableOptions[this.selectedOption];
          if (opt) {
            this.value = opt;
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
          oninput={this.handleInputChange}
          onkeydown={this.handleKeyPress}
          onfocus={this.handleFocus}
          onblur={this.handleBlur}
          type={this.type}
          value={this.value}
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
