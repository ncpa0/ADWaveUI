import { Autocomplete, Input } from "gtk-css-web";
import { Attribute, CustomElement, State } from "jsxte-wc";
import { InputType } from "jsxte/dist/types/jsx/prop-types/input-jsx-props";
import { BaseElement } from "../../base-elements";
import { cls } from "../../utils/cls";
import { forceClassName } from "../../utils/force-class-name";
import { preventDefault } from "../../utils/prevent-default";
import "./input.css";

@CustomElement("g-input")
export class GInputElement extends BaseElement {
  @Attribute()
  accessor inputValue: string | undefined = undefined;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean | undefined = undefined;

  @Attribute()
  accessor name: string | undefined = undefined;

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
  accessor autocomplete: string | undefined = undefined;

  @Attribute({ type: "boolean" })
  accessor autocompleteShowAll: boolean = false;

  @State()
  accessor availableOptions: string[] = [];

  @State()
  accessor selectedOption: number = 0;

  @State()
  accessor isAutocompleteOpen = false;

  constructor() {
    super();

    forceClassName(this, Input.wrapper);

    this.availableOptions = this.getMatchingOptions();

    this.immediateEffect(
      () => {
        this.availableOptions = this.getMatchingOptions();
      },
      (s) => [
        s.inputValue,
        s.autocomplete,
        s.autocompleteShowAll,
        s.inputValue,
      ],
    );

    this.immediateEffect(
      () => {
        this.selectedOption = 0;
      },
      (s) => [s.isAutocompleteOpen],
    );

    this.effect(
      () => {
        if (this.isAutocompleteOpen) {
          this.scrollActiveToView();
        }
      },
      (s) => [s.selectedOption],
    );
  }

  getMatchingOptions(): string[] {
    if (this.autocomplete == null) {
      return [];
    }

    const options = this.autocomplete
      .split(";")
      .map((opt) => opt.toLowerCase());

    if (this.autocompleteShowAll) {
      return options;
    }

    const value = this.inputValue?.toLowerCase();

    if (!value) {
      return options;
    }

    const containsSubString = (
      str: string,
      lookFor: string,
    ): boolean => {
      const substr1 = lookFor.substring(1, lookFor.length - 1);
      const substr2 = lookFor.substring(0, lookFor.length - 2);

      return str.includes(substr1) || str.includes(substr2);
    };

    const resultsPrio1: string[] = [];
    const resultsPrio2: string[] = [];
    const resultsPrio3: string[] = [];

    for (const option of options) {
      if (option === value) {
        continue;
      }

      if (option.startsWith(value)) {
        resultsPrio1.push(option);
      } else if (option.includes(value)) {
        resultsPrio2.push(option);
      }
      // else if (containsSubString(value, option)) {
      //   resultsPrio3.push(option);
      // }
    }

    return resultsPrio1.concat(resultsPrio2).concat(resultsPrio3);
  }

  scrollActiveToView() {
    const autocomplete = this.querySelector(
      `.${Autocomplete.autocomplete}`,
    );

    if (autocomplete == null) {
      return;
    }

    const activeOption = autocomplete?.querySelector(
      `.${Autocomplete.active}`,
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
      activeOption.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }

  Completions = () => {
    if (
      this.autocomplete == null ||
      this.availableOptions.length === 0 ||
      this.isAutocompleteOpen === false
    ) {
      return <></>;
    }

    return (
      <div
        class={cls({
          [Autocomplete.autocomplete]: true,
          "autocomplete-options": true,
        })}
      >
        {this.availableOptions.map((option, idx) => (
          <div
            data-opt={idx}
            class={cls({
              [Autocomplete.option]: true,
              [Autocomplete.active]: idx === this.selectedOption,
            })}
            onclick={this.handleOptionClick}
            onmousedown={preventDefault}
          >
            <span
              data-opt={idx}
              class="text"
            >
              {option}
            </span>
          </div>
        ))}
      </div>
    );
  };

  handleOptionClick = (ev: Event) => {
    ev.preventDefault();
    const target = ev.target as HTMLElement;
    const idx = target.dataset.opt;
    if (idx) {
      this.inputValue = this.availableOptions[parseInt(idx!)];
      this.isAutocompleteOpen = false;
    }
  };

  handleChange = (ev: Event) => {
    const inputElem = ev.target as HTMLInputElement;
    this.inputValue = inputElem.value;
  };

  handleKeyPress = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case "ArrowDown":
        if (this.isAutocompleteOpen) {
          ev.preventDefault();
          this.selectedOption = Math.min(
            this.availableOptions.length - 1,
            this.selectedOption! + 1,
          );
        }
        break;
      case "ArrowUp":
        if (this.isAutocompleteOpen) {
          ev.preventDefault();
          this.selectedOption = Math.max(0, this.selectedOption! - 1);
        }
        break;
      case "Enter":
        if (this.isAutocompleteOpen) {
          ev.preventDefault();
          this.inputValue =
            this.availableOptions[this.selectedOption];
          this.isAutocompleteOpen = false;
        }
        break;
      case "Backspace":
        this.isAutocompleteOpen = true;
        break;
      case "Escape":
        if (this.isAutocompleteOpen) {
          ev.preventDefault();
          this.isAutocompleteOpen = false;
        }
        break;
    }
  };

  handleFocus = () => {
    if (this.availableOptions.length) {
      this.isAutocompleteOpen = true;
    }
  };

  handleBlur = () => {
    this.isAutocompleteOpen = false;
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
          placeholder={this.placeholder}
          minlength={this.minLength}
          maxlength={this.maxLength}
        ></input>
        <this.Completions />
      </>
    );
  }
}
