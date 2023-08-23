import { Input } from "gtk-css-web";
import { Attribute, CustomElement, Element } from "jsxte-dom-diff";
import { InputType } from "jsxte/dist/types/jsx/prop-types/input-jsx-props";
import { cls } from "../../utils/cls";
import "./input.css";

@CustomElement("g-input")
export class GInputElement extends Element {
  @Attribute()
  accessor value: string | undefined = undefined;

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

  handleChange = (ev: Event) => {
    const inputElem = ev.target as HTMLInputElement;
    this.value = inputElem.value;
  };

  render() {
    return (
      <div class="input-container">
        <input
          class={cls({
            [Input.input]: true,
          })}
          oninput={this.handleChange}
          type={this.type}
          value={this.value}
          disabled={this.disabled}
          name={this.name}
          placeholder={this.placeholder}
          minlength={this.minLength}
          maxlength={this.maxLength}
        ></input>
        {this.alertLabel?.length ? (
          <div class="input-msg-box">
            <span class="message alert">{this.alertLabel}</span>
          </div>
        ) : (
          <></>
        )}
        {this.errorLabel?.length ? (
          <div class="input-msg-box">
            <span class="message error">{this.errorLabel}</span>
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  }
}
