document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupContainer = document.getElementById("signup-container");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authStatus = document.getElementById("auth-status");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  let isTeacher = false;

  function showMessage(element, message, className) {
    element.textContent = message;
    element.className = className;
    element.classList.remove("hidden");
    setTimeout(() => element.classList.add("hidden"), 5000);
  }

  function updateAuthControls(authenticated, username) {
    isTeacher = authenticated;
    authStatus.textContent = authenticated
      ? `Teacher mode: ${username}`
      : "Student view";
    loginButton.classList.toggle("hidden", authenticated);
    logoutButton.classList.toggle("hidden", !authenticated);
    signupContainer.classList.toggle("hidden", !authenticated);
  }

  async function refreshSession() {
    const response = await fetch("/auth/session");
    if (!response.ok) {
      throw new Error("Unable to check teacher login status");
    }

    const session = await response.json();
    updateAuthControls(session.authenticated, session.username);
  }

  function createParticipantList(details, activityName) {
    const container = document.createElement("div");
    container.className = "participants-container";

    if (details.participants.length === 0) {
      const emptyMessage = document.createElement("p");
      const italic = document.createElement("em");
      italic.textContent = "No participants yet";
      emptyMessage.appendChild(italic);
      container.appendChild(emptyMessage);
      return container;
    }

    const section = document.createElement("div");
    section.className = "participants-section";
    const heading = document.createElement("h5");
    heading.textContent = "Participants:";
    const list = document.createElement("ul");
    list.className = "participants-list";

    details.participants.forEach((email) => {
      const item = document.createElement("li");
      const emailLabel = document.createElement("span");
      emailLabel.className = "participant-email";
      emailLabel.textContent = email;
      item.appendChild(emailLabel);

      if (isTeacher) {
        const unregisterButton = document.createElement("button");
        unregisterButton.className = "delete-btn";
        unregisterButton.type = "button";
        unregisterButton.dataset.activity = activityName;
        unregisterButton.dataset.email = email;
        unregisterButton.setAttribute(
          "aria-label",
          `Unregister ${email} from ${activityName}`,
        );
        unregisterButton.textContent = "Remove";
        unregisterButton.addEventListener("click", handleUnregister);
        item.appendChild(unregisterButton);
      }

      list.appendChild(item);
    });

    section.append(heading, list);
    container.appendChild(section);
    return container;
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }
      const activities = await response.json();
      activitiesList.replaceChildren();

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select an activity --";
      activitySelect.replaceChildren(placeholder);

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        const description = document.createElement("p");
        description.textContent = details.description;
        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, document.createTextNode(details.schedule));
        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(
          availabilityLabel,
          document.createTextNode(
            `${details.max_participants - details.participants.length} spots left`,
          ),
        );

        activityCard.append(
          title,
          description,
          schedule,
          availability,
          createParticipantList(details, name),
        );
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity,
        )}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "An error occurred");
      }

      showMessage(messageDiv, result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage(
        messageDiv,
        error instanceof Error
          ? error.message
          : "Failed to unregister. Please try again.",
        "error",
      );
      console.error("Error unregistering:", error);
    }
  }

  loginButton.addEventListener("click", () => {
    loginError.classList.add("hidden");
    loginForm.reset();
    loginDialog.showModal();
  });

  document.getElementById("cancel-login").addEventListener("click", () => {
    loginDialog.close();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.classList.add("hidden");

    const formData = new FormData(loginForm);
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to log in");
      }

      loginDialog.close();
      await refreshSession();
      await fetchActivities();
    } catch (error) {
      loginError.textContent =
        error instanceof Error ? error.message : "Unable to log in";
      loginError.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to log out");
      }

      updateAuthControls(false);
      await fetchActivities();
      showMessage(messageDiv, "Logged out", "success");
    } catch (error) {
      showMessage(messageDiv, "Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity,
        )}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "An error occurred");
      }

      showMessage(messageDiv, result.message, "success");
      signupForm.reset();
      await fetchActivities();
    } catch (error) {
      showMessage(
        messageDiv,
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again.",
        "error",
      );
      console.error("Error signing up:", error);
    }
  });

  async function initialize() {
    try {
      await refreshSession();
    } catch (error) {
      updateAuthControls(false);
      showMessage(
        messageDiv,
        "Unable to check teacher login status. Please refresh the page.",
        "error",
      );
      console.error("Error checking teacher login status:", error);
    }
    await fetchActivities();
  }

  initialize();
});
