import "../../base-elements";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Suggestions } from "adwavecss";
import { AttributesOf, customElement, EventNamesOf } from "wc_toolkit";
import { Enum } from "../../utils/enum-attribute";
import { CustomKeyboardEvent, CustomMouseEvent } from "../../utils/events";
import { fuzzyCmp } from "../../utils/fuzzy-search";
import { getUid } from "../../utils/get-uid";
import { preventDefault, stopEvent } from "../../utils/prevent-default";
import "./styles.css";

class AdwInputChangeEvent extends Event {
  declare readonly type: "change";
  value: string;
  t: "select" | "submit";

  constructor(type: "select" | "submit", value: string) {
    super("change", {
      bubbles: true,
    });
    this.value = value;
    this.t = type;
  }
}

/**
 * Performs a simple search through options with the provided query,
 * if the option starts with the exact same string as the query, it
 * is considered a match.
 */
function search(options: string[], query: string): string[] {
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
function fuzzySearch(options: string[], query: string): string[] {
  const results: string[] = [];

  for (let i = 0; i < options.length; i++) {
    const option = options[i]!;
    if (fuzzyCmp(query, option.toLowerCase())) {
      results.push(option);
    }
  }

  return results;
}

const { CustomElement } = customElement("adw-input")
  .attributes({
    value: "string",
    disabled: "boolean",
    name: "string",
    form: "string",
    type: "string",
    placeholder: "string",
    minLength: "number",
    maxLength: "number",
    errorLabel: "string",
    alertLabel: "string",
    /**
     * List of suggestions to show below the input field. Only "matching"
     * suggestions are shown, if any, unless `suggestionsShowAll` is
     * set to `true`.
     */
    suggestions: "string[]",
    /**
     * When enabled, always show all suggestions, regardless of the input value.
     */
    suggestionsShowAll: "boolean",
    /**
     * In which direction the suggestion box should open.
     * - `up` - The box will open above the input.
     * - `down` - The box will open below the input.
     * - `detect` - The box will try to detect if it has
     *   enough space to open `down`, if not it will open `up`.
     *
     * Default: `down`
     */
    suggestionsOrientation: Enum(["up", "down", "detect"]),
    /**
     * When enabled, perform a fuzzy search on the suggestions to determine which
     * ones to show. By default only a exact substring match is considered as "matching".
     */
    fuzzy: "boolean",
  })
  .events([
    "change",
    "optionclick",
    "keydown",
    "input",
    "cut",
    "copy",
    "paste",
    "focus",
    "blur",
  ])
  .context(
    (
      { suggestions, suggestionsShowAll, suggestionsOrientation, value, fuzzy },
    ) => {
      const options = sig.derive(
        suggestions.signal,
        suggestionsShowAll.signal,
        suggestionsOrientation.signal,
        fuzzy.signal,
        value.signal,
        (suggestions, showAll, orientation, fuzzy, value = "") => {
          if (!suggestions || suggestions.length === 0) return [];

          let result: string[];
          if (showAll) {
            result = suggestions.slice();
          } else {
            if (fuzzy) {
              result = fuzzySearch(suggestions, value);
            } else {
              result = search(suggestions, value);
            }
          }

          if (orientation === "up") {
            return result.reverse();
          } else {
            return result;
          }
        },
      );

      return {
        /** Whether suggestions combo box is opened */
        open: sig(false),
        selectedOption: sig(-1),
        options,
        uid: getUid(),
        isInFocus: false,
        hasChanged: false,
        lastScrollIntoView: 0,
      };
    },
  )
  .methods((wc) => {
    const { attribute, context } = wc;

    return {
      focus() {
        wc.thisElement.querySelector("input")?.focus();
      },

      showSuggestions() {
        context.open.dispatch(true);
        context.selectedOption.dispatch(-1);
        this.scrollActiveToView(true);
      },

      hideSuggestions() {
        context.selectedOption.dispatch(-1);
        context.open.dispatch(false);
      },

      scrollActiveToView(forceInstant = false) {
        setTimeout(() => {
          const suggestionElem = wc.thisElement.querySelector(
            `.${Suggestions.suggestions}`,
          );

          if (suggestionElem == null) {
            return;
          }

          const activeOption = suggestionElem?.querySelector(
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
          if (forceInstant || now - context.lastScrollIntoView <= 100) {
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

          context.lastScrollIntoView = now;
        });
      },

      _highlightNextOption(offset = 1) {
        context.selectedOption.dispatch(current =>
          Math.max(0, current - offset)
        );
      },

      _highlightPreviousOption(offset = 1) {
        context.selectedOption.dispatch(current =>
          Math.min(
            context.options.get().length - 1,
            current! + offset,
          )
        );
      },

      _handleOptionClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        const target = event.currentTarget as HTMLElement;
        const idx = target.dataset.opt
          ? Number(target.dataset.opt)
          : undefined;

        const option = idx && context.options.get()[idx] || "";

        wc.emitEvent(
          new CustomMouseEvent("optionclick", { option }, event),
        ).onCommit(() => {
          if (idx != null) {
            attribute.value.set(option);
            this.hideSuggestions();
          }
        });
      },

      _handleInputChange(event: Event) {
        const inputElem = event.target as HTMLInputElement;
        attribute.value.set(inputElem.value);
      },

      _handleKeyDown(event: KeyboardEvent) {
        switch (event.key) {
          case "ArrowUp":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightNextOption();
                }
              });

            break;
          case "ArrowDown":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightPreviousOption();
                }
              });

            break;
          case "PageUp":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightNextOption(8);
                }
              });
            break;
          case "PageDown":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightPreviousOption(8);
                }
              });
            break;
          case "Home":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightNextOption(
                    context.options.get().length - 1,
                  );
                }
              });
            break;
          case "End":
            event.stopPropagation();
            event.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get()) {
                  this._highlightPreviousOption(
                    context.options.get().length - 1,
                  );
                }
              });
            break;
          case "Enter":
            event.stopPropagation();
            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                if (context.open.get() && context.selectedOption.get() >= 0) {
                  event.preventDefault();
                  const opt =
                    context.options.get()[context.selectedOption.get()];
                  if (opt) {
                    attribute.value.set(opt);
                    this.hideSuggestions();
                    context.hasChanged = false;
                    wc.emitEvent(
                      new AdwInputChangeEvent(
                        "select",
                        attribute.value.get() ?? "",
                      ),
                    );
                  }
                } else if (context.hasChanged) {
                  context.hasChanged = false;
                  wc.emitEvent(
                    new AdwInputChangeEvent(
                      "submit",
                      attribute.value.get() ?? "",
                    ),
                  );
                }
              })
              .onCancel(() => {
                event.preventDefault();
              });
            break;
          case "Backspace":
            event.stopPropagation();
            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                this.showSuggestions();
              })
              .onCancel(() => {
                event.preventDefault();
              });
            break;
          case "Escape":
            event.stopPropagation();
            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, event))
              .onCommit(() => {
                this.hideSuggestions();
              })
              .onCancel(() => {
                event.preventDefault();
              });
            break;
        }
      },

      _handleFocus(ev: FocusEvent) {
        context.isInFocus = true;
        if (context.options.get().length) {
          this.showSuggestions();
        }
      },

      _handleBlur(ev: FocusEvent) {
        context.isInFocus = false;
        this.hideSuggestions();
        if (context.hasChanged) {
          context.hasChanged = false;
          wc.emitEvent(
            new AdwInputChangeEvent("submit", attribute.value.get() ?? ""),
          );
        }
      },
    };
  })
  .connected((wc) => {
    const {
      context,
      method,
      attribute: {
        disabled,
        errorLabel,
        form,
        maxLength,
        minLength,
        name,
        placeholder,
        suggestions,
        suggestionsOrientation,
        type,
        value,
      },
    } = wc;

    const forcedPosition = sig<"up" | "down">();

    wc.thisElement.classList.add(Input.wrapper);

    const isHidden = sig.derive(
      suggestions.signal,
      context.options,
      context.open,
      (allSuggestions, options, open) => {
        return !open || options.length === 0 || !allSuggestions
          || allSuggestions.length === 0;
      },
    );

    const isUp = sig.derive(
      suggestionsOrientation.signal,
      forcedPosition,
      (o, fo) => {
        if (o === "detect") {
          o = fo;
        }
        return o === "up";
      },
    );

    wc.onChange([value], () => {
      if (context.isInFocus) {
        context.hasChanged = true;
      }
    });

    wc.onChange([value, suggestions], () => {
      if (context.selectedOption.get() === -1) {
        return;
      }

      context.selectedOption.dispatch(
        suggestionsOrientation.get() === "up"
          ? context.options.get().length - 1
          : 0,
      );
    });

    wc.onChange([context.open], () => {
      if (context.open.get() && suggestionsOrientation.get() === "detect") {
        const rect = inputElem.getBoundingClientRect();
        const distanceToBottom = window.innerHeight - rect.bottom;
        const fontSize = getComputedStyle(suggestionBox).fontSize;
        const emSize = Number(fontSize.replace("px", ""));

        const maxTargetHeight = Math.min(
          // 16em
          16 * emSize,
          // 80vh
          0.8 * window.innerHeight,
        );
        const targetHeight = Math.min(
          maxTargetHeight,
          context.options.get().length * (1.75 * emSize),
        );

        if (distanceToBottom < targetHeight) {
          forcedPosition.dispatch("up");
        } else {
          forcedPosition.dispatch("down");
        }
      }
    });

    wc.cleanup(
      context.selectedOption.observe(() => {
        method.scrollActiveToView();
      }).detach,
    );

    const inputElem = (
      <input
        class={{
          [Input.input]: true,
          [Input.disabled]: disabled.signal,
        }}
        oninput={method._handleInputChange}
        onkeydown={method._handleKeyDown}
        onfocus={method._handleFocus}
        onblur={method._handleBlur}
        onchange={stopEvent}
        type={type.signal}
        value={value.signal}
        disabled={disabled.signal}
        name={name.signal}
        attribute:form={form.signal}
        placeholder={placeholder.signal}
        attribute:minlength={minLength.signal}
        attribute:maxlength={maxLength.signal}
        aria-placeholder={placeholder.signal}
        aria-label={placeholder.signal}
        aria-invalid={errorLabel.signal.derive(err => !!err)}
        aria-haspopup="listbox"
        aria-expanded={context.open}
        aria-controls={context.uid}
      />
    );

    const suggestionBox = (
      <div
        id={context.uid}
        class={{
          [Suggestions.suggestions]: true,
          "suggestions-options": true,
          "_adw_hidden": isHidden,
          "orientation-down": sig.not(isUp),
          "orientation-up": isUp,
          "top": isUp,
        }}
        role="listbox"
      >
        {context.options.derive((options) => {
          return options.map((optLabel, idx) => {
            const isActive = sig.eq(context.selectedOption, idx);
            return (
              <div
                data-opt={idx}
                class={{
                  [Suggestions.option]: true,
                  [Suggestions.active]: isActive,
                }}
                onclick={method._handleOptionClick}
                onmousedown={preventDefault}
                role="option"
              >
                <span class="text">
                  {optLabel}
                </span>
              </div>
            );
          });
        })}
      </div>
    );

    wc.attach(inputElem);
    wc.attach(suggestionBox);
  })
  .register();

const AdwInput = CustomElement;
type AdwInput = InstanceType<typeof CustomElement>;

type AdwInputAttributes = AttributesOf<typeof AdwInput>;
type AdwInputEvents = EventNamesOf<typeof AdwInput>;

export { AdwInput };
export type { AdwInputAttributes, AdwInputChangeEvent, AdwInputEvents };
