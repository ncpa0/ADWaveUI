<p align="center">
    <h1 align="center">ADWave UI</h1>
    <p align="center">
        Web Components inspired by the Gtk's Adwaita theme.
    </p>
    <p align="center">
        <a href="https://ncpa0.github.io/adwave-docs/">
            Examples
        </a>
    </p>
</p>

## Components

1. [Input](#input)
2. [Selector](#selector)
3. [Slider](#slider)
4. [Switch](#switch)

## Input

```html
<adw-input
    placeholder="Put in your name"
></adw-input>
```

### Properties

| Property                | Description                                                                 | Default |
|-------------------------|-----------------------------------------------------------------------------|---------|
| `disabled`              | If the input is disabled or not.                                            | "false" |
| `form`                  | The form the input belongs to.                                              |         |
| `maxlength`             | The maximum length of the input.                                            |         |
| `minlength`             | The minimum length of the input.                                            |         |
| `name`                  | The name of the input, used when submitting a form.                         |         |
| `placeholder`           | Text displayed when the input is empty.                                     |         |
| `suggestions`           | List of suggested strings to display when the input is focused.             |         |
| `suggestionsorientation`| Determines whether the list of suggestions appears above or below the input field. `up` or `down`. | "down"  |
| `suggestionsshowall`    | Set to "true" to always display all the suggestions.                        | "false" |
| `fuzzy`                 | When set to "true" the suggestions will be filtered using a fuzzy search algorithm as the user types. By default filtering is done using a simple string match. |         |
| `type`                  | The type of the input. (text, password, email, etc.)                        | "text"  |
| `value`                 | The current value of the input.                                             |         |

## Selector

```html
<adw-selector placeholder="Select option">
    <adw-option value="1" selected="true">
        Option 1
    </adw-option>
    <adw-option value="2">
        Option 2
    </adw-option>
    <adw-option value="3">
        Option 3
    </adw-option>
</adw-selector>
```

### Properties

| Property                | Description                                                                 | Default |
|-------------------------|-----------------------------------------------------------------------------|---------|
| `disabled`              | If the selector is disabled or not.                                         | "false" |
| `form`                  | The form the selector belongs to.                                           |         |
| `name`                  | The name of the selector, used when submitting a form.                      |         |
| `orientation`           | Determines whether the list of options appears above or below the selector. `up` or `down`. | "down"  |
| `placeholder`           | Text displayed when no option is selected.                                  |         |

### adw-option properties

| Property                | Description                                                                 | Default |
|-------------------------|-----------------------------------------------------------------------------|---------|
| `selected`              | If the option is selected or not.                                           | "false" |
| `value`                 | The value of the option.                                                    |         |

## Slider

```html
<adw-slider
    min="0"
    max="100"
    value="50"
></adw-slider>
```

### Properties

| Property                | Description                                                                 | Default |
|-------------------------|-----------------------------------------------------------------------------|---------|
| `disabled`              | If the slider is disabled or not.                                           | "false" |
| `form`                  | The form the slider belongs to.                                             |         |
| `max`                   | The maximum value on the slider.                                            | 100     |
| `min`                   | The minimum value on the slider.                                            | 0       |
| `name`                  | The name of the slider, used when submitting a form.                        |         |
| `precision`             | The number of decimal places to round the value to.                         | 4       |
| `step`                  | The amount to increment or decrement the value by when moving the slider.   | 1       |
| `value`                 | The current value of the slider.                                            |         |

## Switch

```html
<adw-switch
    active="true"
></adw-switch>
```

### Properties

| Property                | Description                                                                 | Default |
|-------------------------|-----------------------------------------------------------------------------|---------|
| `disabled`              | If the switch is disabled or not.                                           |         |
| `form`                  | The form the switch belongs to.                                             |         |
| `name`                  | The name of the switch, used when submitting a form.                        |         |
| `active`                | If the switch is active or not.                                             | "false" |