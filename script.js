const movieStartInput = document.querySelector("#movie-start");
const movieStartMessage = document.querySelector("#movie-start-message");
const cueRows = Array.from(document.querySelectorAll("[data-cue]"));
const cueInputs = cueRows.map((row) => row.querySelector("input"));
const timeInputs = [movieStartInput, ...cueInputs];
const emptyOutput = "--:--:--";
const touchedInputs = new WeakSet();

function parseTimestamp(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { state: "empty" };
  }

  const match = trimmed.match(/^(\d{2}):([0-5]\d):([0-5]\d)$/);

  if (!match) {
    return {
      state: "invalid",
      message: "Use HH:MM:SS.",
    };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  return {
    state: "valid",
    totalSeconds: (hours * 3600) + (minutes * 60) + seconds,
  };
}

function formatTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function normalizeTimestampInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 6);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

function hasBeenTouched(input) {
  return touchedInputs.has(input);
}

function shouldShowFieldError(input) {
  return hasBeenTouched(input) && document.activeElement !== input;
}

function setMovieStartState(message, isInvalid) {
  movieStartInput.parentElement.parentElement.classList.toggle("is-invalid", isInvalid);
  movieStartMessage.textContent = message;
}

function clearCueState(row) {
  row.classList.remove("is-invalid", "is-valid");
  row.querySelector(".field-message").textContent = "";
  row.querySelector(".field-output").textContent = emptyOutput;
}

function setCueInvalid(row, message) {
  row.classList.add("is-invalid");
  row.classList.remove("is-valid");
  row.querySelector(".field-message").textContent = message;
  row.querySelector(".field-output").textContent = "--:--:--";
}

function setCueValid(row, clipSeconds) {
  row.classList.add("is-valid");
  row.classList.remove("is-invalid");
  row.querySelector(".field-message").textContent = "";
  row.querySelector(".field-output").textContent = formatTimestamp(clipSeconds);
}

function updateCalculations() {
  const movieStart = parseTimestamp(movieStartInput.value);
  const showMovieStartError = movieStart.state === "invalid" && shouldShowFieldError(movieStartInput);

  if (movieStart.state === "empty") {
    setMovieStartState("", false);
  } else if (showMovieStartError) {
    setMovieStartState(movieStart.message, true);
  } else {
    setMovieStartState("", false);
  }

  cueRows.forEach((row) => {
    const input = row.querySelector("input");
    const cueTime = parseTimestamp(input.value);
    const showCueError = shouldShowFieldError(input);

    if (cueTime.state === "empty") {
      clearCueState(row);
      return;
    }

    if (cueTime.state === "invalid") {
      if (showCueError) {
        setCueInvalid(row, cueTime.message);
      } else {
        clearCueState(row);
      }
      return;
    }

    if (movieStart.state !== "valid") {
      row.classList.remove("is-invalid", "is-valid");
      row.querySelector(".field-message").textContent = "";
      row.querySelector(".field-output").textContent = emptyOutput;
      return;
    }

    if (cueTime.totalSeconds < movieStart.totalSeconds) {
      if (showCueError) {
        setCueInvalid(row, "Cue time cannot be earlier than offset time.");
      } else {
        clearCueState(row);
      }
      return;
    }

    setCueValid(row, cueTime.totalSeconds - movieStart.totalSeconds);
  });
}

timeInputs.forEach((input) => {
  input.addEventListener("input", () => {
    updateCalculations();
  });

  input.addEventListener("focus", () => {
    updateCalculations();
  });

  input.addEventListener("blur", () => {
    touchedInputs.add(input);
    input.value = normalizeTimestampInput(input.value);
    updateCalculations();
  });
});

updateCalculations();
