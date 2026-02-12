import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

@customElement("google-signin-button")
export class GoogleSignInButton extends LitElement {
  @property({ type: String }) clientId = "";
  @property({ type: String }) theme = "outline"; // "outline" | "filled_blue" | "filled_black"
  @property({ type: String }) size = "large"; // "large" | "medium" | "small"
  @property({ type: String }) text = "signin_with"; // "signin_with" | "signup_with" | "continue_with" | "signin"
  @property({ type: String }) shape = "rectangular"; // "rectangular" | "pill" | "circle" | "square"
  @property({ type: Number }) width?: number;

  // Events: 'success' (detail: { credential })

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  firstUpdated() {
    this.renderGoogleButton();
  }

  updated(changedProperties: Map<string, any>) {
    if (
      changedProperties.has("theme") ||
      changedProperties.has("size") ||
      changedProperties.has("text")
    ) {
      this.renderGoogleButton();
    }
  }

  isValid() {
    return !!(window.google && window.google.accounts && window.google.accounts.id);
  }

  renderGoogleButton() {
    if (!this.isValid()) {
      // Retry in a bit if script hasn't loaded
      setTimeout(() => this.renderGoogleButton(), 500);
      return;
    }

    if (!this.clientId) {
      console.warn("Google Client ID is missing");
      return;
    }

    try {
      window.google!.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          this.dispatchEvent(new CustomEvent("success", { detail: response }));
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const options: any = {
        theme: this.theme,
        size: this.size,
        text: this.text,
        shape: this.shape,
      };

      if (this.width) {
        options.width = this.width;
      }

      window.google!.accounts.id.renderButton(
        this.shadowRoot!.getElementById("buttonDiv")!,
        options,
      );
    } catch (e) {
      console.error("Error rendering Google Sign-In button:", e);
    }
  }

  render() {
    return html`
      <div id="buttonDiv"></div>
    `;
  }
}
