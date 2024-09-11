import "../../base-elements";
import { Selector } from "adwavecss";
import "../../index.css";
import { CustomKeyboardEvent, CustomMouseEvent } from "../../utils/events";
import { getUid } from "../../utils/get-uid";
import { stopEvent } from "../../utils/prevent-default";
import "./selector.css";
import { sig, SignalListenerReference } from "@ncpa0cpl/vanilla-jsx/signals";
import { customElement, EventNamesOf } from "wc_toolkit";
import { AttributesOf } from "wc_toolkit";
import { arrEq } from "../../utils/cmp-arrray";
import { debounced } from "../../utils/debounced";
import { Enum } from "../../utils/enum-attribute";
import {
  AdwSelectorChangeEvent,
  OptionAttributeChangeEvent,
  OptionContentChangeEvent,
} from "./events";
import { AdwSelectorOption } from "./option";

type InnerDialgoElement = HTMLDialogElement & {
  _openEffect?: SignalListenerReference<boolean>;
};

const IS_MOBILE = typeof navigator !== "undefined"
  && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const SEARCHABLE_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-[]\\{}|;':\",./<>?"
    .split(
      "",
    );

const FOCUS_CHANGE_EVENT_THROTTLE = 60;

const { CustomElement } = customElement("adw-selector")
  .attributes({
    placeholder: "string",
    disabled: "boolean",
    name: "string",
    form: "string",
    value: "string",
    /**
     * In which direction the dropdown should open.
     * - `up` - The dropdown will open above the selector.
     * - `down` - The dropdown will open below the selector.
     * - `detect` - The dropdown will try to detect if it has
     *   enough space to open `down`, if not it will open `up`.
     *
     * Default: `down`
     */
    orientation: Enum(["up", "down", "detect"]),
    /**
     * When enabled, the options will be displayed in reversed order.
     */
    reverseOrder: "boolean",
    /**
     * When enabled, the selected option will be scrolled into view when the dropdown opens.
     */
    scrollIntoViewOnOpen: "boolean",
  }, {
    scrollIntoViewOnOpen: {
      htmlName: "scrollintoview",
    },
  })
  .events(["change", "click", "keydown"])
  .context(({ value }) => {
    const options = sig<AdwSelectorOption[]>([]);
    const optionsDep = sig(0);
    const label = sig.derive(
      options,
      value.signal,
      (options, value) => {
        return options.find((option) =>
          !option.inert && option.isEqualTo(value)
        )?.getLabel();
      },
    );

    return {
      open: sig(false),
      options,
      optionsDep,
      label,
      uid: getUid(),
      searchInputMemory: "",
      clearSearchInputMemoryTimeout: undefined as number | undefined,
      optionsList: undefined as HTMLDivElement | undefined,
      innerDialog: undefined as InnerDialgoElement | undefined,
      lastFocusChange: 0,
    };
  })
  .methods((wc) => {
    const {
      attribute: { value, orientation, disabled },
      context,
    } = wc;

    return {
      /**
       * Open or closes the dropdown, depending on it's current state.
       */
      toggle() {
        context.open.dispatch((open) => !open);
      },

      getSelectedOption(): AdwSelectorOption | undefined {
        const currentValue = value.get();
        return context.options.get().find(opt => opt.isEqualTo(currentValue));
      },

      scrollToOption(
        value: string | null,
        behavior: ScrollBehavior = "instant",
      ) {
        if (!context.optionsList || value == null) {
          return;
        }

        const allOptElems = Array.from(
          context.optionsList.querySelectorAll("button.option"),
        ) as HTMLButtonElement[];

        const activeOptionElem = allOptElems.find(
          (btn) => btn.dataset.option === value,
        );

        if (activeOptionElem) {
          context.optionsList.scrollTo({
            top: activeOptionElem.offsetTop
              - context.optionsList.clientHeight / 2,
            behavior,
          });
          activeOptionElem.focus();
        }
      },

      focus() {
        // @ts-expect-error
        wc.thisElement.querySelector(`.${Selector.selector}`)?.focus();
      },

      select(optionValue?: string): boolean {
        if (optionValue == null) {
          return false;
        }

        let success = false;

        const options = context.options.get();
        for (let i = 0; i < options.length; i++) {
          const option = options[i]!;
          const isSelected = option.isEqualTo(optionValue);

          if (isSelected) {
            value.set(option.value);
            option.setSelected(true);
            success = true;
          } else {
            option.setSelected(false);
          }
        }

        return success;
      },

      /**
       * Selects the option that is offset from the currently focused
       * option. (e.g. focusOption(1) should select the option following
       * the currently focused one whereas focusOption(-2) should select
       * the second option that's behind the focused option)
       */
      focusOption(offset: number) {
        if (!context.optionsList) {
          return;
        }

        let currentOption = context.optionsList.querySelector(
          `.${Selector.option}:focus`,
        ) as HTMLButtonElement | undefined;

        if (!currentOption) {
          currentOption = context.optionsList.querySelector(
            `.${Selector.option}.selected`,
          ) as HTMLButtonElement | undefined;
        }

        if (!currentOption) {
          const reverse = orientation.get() === "up";
          const firstOption = context.optionsList.querySelector(
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
      },

      _forceOptionsRerender: debounced(() => {
        context.optionsDep.dispatch(v => v + 1 % 128);
      }),

      _setSelectedByValue(options: AdwSelectorOption[], value: string) {
        let selected: AdwSelectorOption | undefined;

        for (let i = 0; i < options.length; i++) {
          const opt = options[i]!;
          if (opt.isEqualTo(value)) {
            selected = opt;
          } else {
            opt.selected = false;
          }
        }

        if (selected) {
          selected.selected = true;
        }
        return selected;
      },

      _updateSelectableOptions(
        children: Array<Element | Text>,
        forceDispatch = false,
      ) {
        const currentValue = value.get();

        const options = children.filter(
          (child): child is AdwSelectorOption =>
            child instanceof AdwSelectorOption,
        );

        const selected = options.filter(opt => opt.selected && !opt.inert);

        if (!(selected.length === 0 && currentValue == null)) {
          // both value and option with selected attr are present
          if (selected.length > 0 && currentValue != null) {
            if (
              !(selected.length === 1 && selected[0]!.isEqualTo(currentValue))
            ) {
              const selectedOpt = this._setSelectedByValue(
                options,
                currentValue,
              );
              if (!selectedOpt) {
                value.unset();
              }
            }
          } // value is set but not a single option is selected
          else if (selected.length === 0 && currentValue != null) {
            const selectedOpt = this._setSelectedByValue(
              options,
              currentValue,
            );
            if (!selectedOpt) {
              value.unset();
            }
          } // an option is selected but value is not set
          else if (selected.length > 0 && currentValue == null) {
            const selectedOpt = selected.pop()!;

            for (let i = 0; i < selected.length; i++) {
              selected[i]!.selected = false;
            }

            value.set(selectedOpt.value);
          }
        }

        if (forceDispatch || !arrEq(context.options.get(), options)) {
          context.options.dispatch(options);
        }
      },

      _tryInputSearch() {
        if (context.searchInputMemory.length === 0) return;
        const searchTerm = context.searchInputMemory.toLowerCase();

        const options = context.options.get();

        let foundOpt = options.find((opt) => {
          const label = opt.getLabel().toLowerCase();
          return label.startsWith(searchTerm);
        });

        if (!foundOpt) {
          foundOpt = options.find((opt) => {
            const label = opt.getLabel().toLowerCase();
            return label.includes(searchTerm);
          });
        }

        if (foundOpt) {
          this.scrollToOption(foundOpt.getValue(), "smooth");
        }
      },

      _handleClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (disabled.get()) {
          return;
        }

        wc
          .emitEvent(new CustomMouseEvent("click", { type: "selector" }, e))
          .onCommit(() => {
            this.toggle();
          });
      },

      _handleDialogClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        wc
          .emitEvent(new CustomMouseEvent("click", { type: "dialog" }, e))
          .onCommit(() => {
            // close the modal if the click is outside the dialog
            if (
              context.open.get()
              && !context.optionsList?.contains(e.target as any)
            ) {
              context.open.dispatch(false);
            }
          });
      },

      _handleOptionClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        const btn = e.currentTarget as HTMLButtonElement | undefined;
        const { option: optValue } = btn?.dataset ?? {};

        wc
          .emitEvent(
            new CustomMouseEvent(
              "click",
              {
                type: "option",
                option: optValue,
              },
              e,
            ),
          )
          .onCommit(() => {
            if (disabled.get() || optValue == null) {
              return;
            }

            const success = this.select(optValue);

            if (success) {
              wc.emitEvent(new AdwSelectorChangeEvent(value.get()));
              context.open.dispatch(false);
              this.focus();
            }
          });
      },

      _handleModalCancel(e: Event) {
        context.open.dispatch(false);
      },

      _handleKeyDown(ev: KeyboardEvent) {
        if (disabled.get()) {
          return;
        }

        switch (ev.key) {
          case " ":
          case "Enter": {
            ev.stopPropagation();
            ev.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
              .onCommit(() => {
                if (!context.open.get()) {
                  context.open.dispatch(true);
                } else {
                  const target = ev.target as HTMLElement;
                  if ((target as HTMLElement).tagName === "BUTTON") {
                    if (ev.key === "Enter") target.click();
                  } else {
                    context.open.dispatch(false);
                  }
                }
              });
            break;
          }
          case "ArrowUp": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(-1);
                });
            });
            break;
          }
          case "ArrowDown": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(+1);
                });
            });
            break;
          }
          case "PageUp": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(-10);
                });
            });
            break;
          }
          case "PageDown": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(+10);
                });
            });
            break;
          }
          case "Home": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(-context.options.get().length);
                });
            });
            break;
          }
          case "End": {
            ev.stopPropagation();
            ev.preventDefault();

            this._withFocusChangeEvent(() => {
              wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
                .onCommit(() => {
                  this.focusOption(+context.options.get().length);
                });
            });
            break;
          }
          case "Escape": {
            ev.stopPropagation();
            ev.preventDefault();

            wc.emitEvent(new CustomKeyboardEvent("keydown", {}, ev))
              .onCommit(() => {
                if (context.open.get()) {
                  context.open.dispatch(false);
                  this.focus();
                }
              });

            break;
          }
          default:
            if (SEARCHABLE_CHARS.includes(ev.key)) {
              context.searchInputMemory += ev.key;
              window.clearTimeout(context.clearSearchInputMemoryTimeout);
              context.clearSearchInputMemoryTimeout = window.setTimeout(() => {
                context.searchInputMemory = "";
              }, 1000);
              this._tryInputSearch();
            }
            break;
        }
      },

      _withFocusChangeEvent(handler: () => void) {
        const now = Date.now();
        if (now - context.lastFocusChange > FOCUS_CHANGE_EVENT_THROTTLE) {
          context.lastFocusChange = now;
          handler();
        }
      },
    };
  })
  .connected((wc) => {
    const {
      context,
      method,
      attribute: {
        value,
        disabled,
        form,
        name,
        orientation,
        placeholder,
        reverseOrder,
        scrollIntoViewOnOpen,
      },
    } = wc;

    const forcedPosition = sig<"up" | "down">();

    wc.listen(
      OptionAttributeChangeEvent.EVNAME,
      (event: OptionAttributeChangeEvent) => {
        switch (event.attributeName) {
          case "selected": {
            const opt = event.target;
            if (opt.selected && opt.value != null) {
              value.set(opt.value);
            }
            break;
          }
          case "value": {
            const opt = event.target;
            const selectedOpt = method.getSelectedOption();
            if (opt.selected && opt === selectedOpt) {
              value.set(opt.value);
            }
            method._updateSelectableOptions(wc.getChildren(), true);
            break;
          }
          case "inert": {
            const opt = event.target;
            const selectedOpt = method.getSelectedOption();
            if (opt.selected && opt === selectedOpt) {
              value.unset();
              opt.selected = false;
            }
            method._forceOptionsRerender();
            break;
          }
        }
      },
    );

    wc.listen(
      OptionContentChangeEvent.EVNAME,
      (event: OptionContentChangeEvent) => {
        method._forceOptionsRerender();
      },
    );

    wc.onChildrenChange((children) => {
      method._updateSelectableOptions(children);
    });

    const globalClickListener = wc.listenDocument(
      "click",
      (event) => {
        if (!wc.thisElement.contains(event.target as Node)) {
          context.open.dispatch(false);
          globalClickListener.disable();
        }
      },
      { initEnabled: false },
    );

    wc.onChange([value], () => {
      method._updateSelectableOptions(wc.getChildren());
    });

    wc.onChange([context.open], () => {
      globalClickListener.disable();

      if (context.open.get()) {
        /**
         * When opening the selector, scroll into view to the first
         * option.
         */
        if (context.optionsList) {
          const reverse = orientation.get() === "up";

          if (value.get() != null) {
            method.scrollToOption(value.get());
          } else {
            context.optionsList.scrollTo({
              top: reverse ? context.optionsList.scrollHeight : 0,
              behavior: "instant",
            });
          }
        }

        /** When clicking outside of the visible modal, close it. */
        if (!IS_MOBILE) {
          globalClickListener.enable();

          if (scrollIntoViewOnOpen.get() && context.optionsList) {
            // wait for animation to finish
            setTimeout(() => {
              const selectedButton = context.optionsList?.querySelector(
                ".option.selected",
              );
              if (context.open.get() && selectedButton) {
                selectedButton.scrollIntoView({
                  behavior: "smooth",
                });
              }
            }, 201);
          }

          if (orientation.get() === "detect") {
            const rect = rootElem.getBoundingClientRect();
            const distanceToBottom = window.innerHeight - rect.bottom;
            const fontSize = getComputedStyle(rootElem).fontSize;
            const emSize = Number(fontSize.replace("px", ""));

            const maxTargetHeight = Math.min(
              // 20em
              20 * emSize,
              // 80vh
              0.8 * window.innerHeight,
            );
            const targetHeight = Math.min(
              maxTargetHeight,
              context.options.get().length * (1.9 * emSize),
            );

            if (distanceToBottom < targetHeight) {
              forcedPosition.dispatch("up");
            } else {
              forcedPosition.dispatch("down");
            }
          }
        }
      }
    });

    const Option = (props: { option: AdwSelectorOption }) => {
      const isSelected = value.signal.derive(v => props.option.isEqualTo(v));
      const isInert = props.option.inert;

      if (isInert) {
        return (
          <button
            class={[Selector.option, "inert"]}
            role="presentation"
            onclick={stopEvent}
          >
            <span />
            <span class="opt-label">{props.option.getLabel()}</span>
            <span />
          </button>
        );
      }

      const elem = (
        <button
          class={{
            [Selector.option]: true,
            selected: isSelected,
          }}
          onclick={method._handleOptionClick}
          data-option={props.option.getValue()}
          role="option"
          aria-selected={isSelected}
        >
          {props.option.getLabel()}
        </button>
      ) as HTMLButtonElement;

      return elem;
    };

    const OptionsListMobile = () => {
      context.optionsList = (
        <div
          id={context.uid}
          class={[Selector.optionsList, Selector.noPosition]}
          role="listbox"
        >
          {sig.derive(
            context.options,
            reverseOrder.signal,
            context.optionsDep,
            (options, reverse) => {
              if (reverse) {
                options = options.slice().reverse();
              }

              return options.map((option) => <Option option={option} />);
            },
          )}
        </div>
      ) as HTMLDivElement;

      context.innerDialog = (
        <dialog
          onclick={method._handleDialogClick}
          oncancel={method._handleModalCancel}
        >
          {context.optionsList}
        </dialog>
      ) as InnerDialgoElement;

      context.innerDialog._openEffect = context.open.add((open) => {
        if (open) {
          context.innerDialog!.showModal();
        } else {
          context.innerDialog!.close();
        }
      });

      return context.innerDialog;
    };

    const OptionsListDesktop = () => {
      const isTop = sig.derive(
        orientation.signal,
        forcedPosition,
        (o, fo) => {
          if (o === "detect") {
            o = fo;
          }
          return o === "up";
        },
      );

      context.optionsList = (
        <div
          id={context.uid}
          class={{
            [Selector.optionsList]: true,
            [Selector.top]: isTop,
          }}
          role="listbox"
        >
          {sig.derive(
            context.options,
            reverseOrder.signal,
            context.optionsDep,
            (options, reverse) => {
              if (reverse) {
                options = options.slice().reverse();
              }

              return options.map((option) => <Option option={option} />);
            },
          )}
        </div>
      ) as HTMLDivElement;
      return context.optionsList;
    };

    const HiddenSelect = () => {
      return (
        <select
          class="_adw_hidden"
          name={name.signal}
          attribute:form={form.signal}
          disabled={disabled.signal}
          aria-hidden={true}
          onchange={stopEvent}
        >
          {context.options.derive(options =>
            options.map((option, index) => {
              return (
                <option
                  value={option.getValue()}
                  selected={value.signal.derive(v => option.isEqualTo(v))}
                />
              );
            })
          )}
        </select>
      );
    };

    const rootElem = (
      <div
        class={{
          [Selector.noPosition]: IS_MOBILE,
          [Selector.selector]: true,
          [Selector.disabled]: disabled.signal,
          [Selector.opened]: context.open,
          closed: sig.not(context.open),
        }}
        onclick={method._handleClick}
        onkeydown={method._handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={context.open}
        aria-controls={context.uid}
        aria-placeholder={placeholder.signal}
      >
        <span
          class={{
            [Selector.selectedOption]: true,
            "with-placeholder": sig.not(context.label),
          }}
        >
          {sig.nuc(context.label, placeholder.signal)}
        </span>
        <span class={Selector.downButton}></span>
        {IS_MOBILE ? <OptionsListMobile /> : <OptionsListDesktop />}
        <HiddenSelect />
      </div>
    );

    wc.attach(rootElem);
  })
  .register();

const AdwSelector = CustomElement;
type AdwSelector = InstanceType<typeof CustomElement>;

type AdwSelectorAttributes = AttributesOf<typeof AdwSelector>;
type AdwSelectorEvents = EventNamesOf<typeof AdwSelector>;

export { AdwSelector };
export type { AdwSelectorAttributes, AdwSelectorEvents };
