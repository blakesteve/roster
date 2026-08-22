import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorState } from "./ErrorState";
import { Button } from "../../atoms/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi, faCompass } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
### The "Broken" Placeholder

The **ErrorState** component replaces a section of UI that failed to load. 

**UX Best Practices:**
* **Don't Blame the User:** Use passive voice ("An error occurred") rather than active ("You failed").
* **Provide a Path Forward:** Always offer a Retry button or a link to a safe page (like the Dashboard).
`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["card", "page"],
    },
    onRetry: { action: "retried" },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof ErrorState>;

// 1. Widget Context: Component Crash
export const Default: Story = {
  args: {
    title: "Failed to Load Picks",
    description: "We encountered an issue fetching the latest lines.",
    onRetry: () => alert("Retrying fetch..."),
    variant: "card",
  },
};

// 2. Network Error
export const NetworkError: Story = {
  args: {
    title: "Connection Lost",
    description: "Please check your internet connection and try again.",
    icon: <FontAwesomeIcon icon={faWifi} />,
    onRetry: () => alert("Reconnecting..."),
    variant: "card",
  },
};

// 3. Full Page Error (404)
export const PageNotFound: Story = {
  args: {
    title: "Page Not Found",
    description:
      "The league or player you are looking for does not exist. It may have been deleted or the URL is incorrect.",
    variant: "page",
    icon: <FontAwesomeIcon icon={faCompass} />,
    action: (
      <Button colorScheme="primary" onClick={() => alert("Go Home")}>
        Return to Dashboard
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `page` variant for full-screen errors like 404s or 500s. It uses neutral typography instead of the red alert theme.",
      },
    },
  },
};

// 4. Permission Denied (403)
export const AccessDenied: Story = {
  args: {
    title: "Access Restricted",
    description:
      "You do not have permission to view the Commissioner Settings for this league.",
    variant: "card",
    action: (
      <div className="rst:flex rst:gap-2">
        <Button variant="outline" colorScheme="error" onClick={() => {}}>
          Request Access
        </Button>
        <Button variant="ghost" colorScheme="neutral" onClick={() => {}}>
          Go Back
        </Button>
      </div>
    ),
  },
};

/**
 * The gap that prompted the fix: this component had no dark handling at all, so
 * the default `dashed` variant rendered as a white panel on a dark page. Found
 * in an admin queue, on a memorial site, in the one state a user only sees when
 * there is nothing else on screen to distract from it.
 */
export const ErrorStateInDarkMode: Story = {
  args: { title: "Could not load", description: "Something went wrong on our end." },
  decorators: [
    (Story) => (
      <div className="rst:grid rst:grid-cols-1 md:rst:grid-cols-2 rst:gap-6">
        <div className="light rst:bg-gray-50 rst:p-6 rst:rounded-xl rst:border rst:border-gray-100">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode
          </p>
          <Story />
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Surface, border, title, description and icon chip all carry a dark counterpart. Before this, every one of them was light-only.",
      },
    },
  },
};
