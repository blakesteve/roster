import type { Meta, StoryObj } from "@storybook/react";
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
      <div className="flex gap-2">
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
