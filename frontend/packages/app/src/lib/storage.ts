export const setLocalStorage = (key: string, value: any) => {
  try {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const removeLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};
export const getLocalStorage = (key: string) => {
  const value = localStorage.getItem(key);
  if (!value) return false;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const hasKeyInLocalStorage = (key: string) => {
  return Object.prototype.hasOwnProperty.call(localStorage, key);
};

export const setLikedTask = (
  likedTaskKey: string,
  dateKey: string,
  task: Array<object>,
): void => {
  const likedTasksJSON = getLocalStorage(likedTaskKey);
  const likedTasks = likedTasksJSON ? likedTasksJSON : {};
  if (!Array.isArray(likedTasks[dateKey])) {
    likedTasks[dateKey] = [];
  }

  likedTasks[dateKey] = task;

  localStorage.setItem(likedTaskKey, JSON.stringify(likedTasks));
};

export const removeFromLikedTask = (
  likedTaskKey: string,
  dateKey: string,
): void => {
  const likedTasks = getLocalStorage(likedTaskKey);

  // If no data exists, there's nothing to remove
  if (!likedTasks) {
    return;
  }

  if (likedTasks[dateKey]) {
    delete likedTasks[dateKey];
    localStorage.setItem(likedTaskKey, JSON.stringify(likedTasks));
  }
};

export type addAction = "Yes" | "No";

export const toggleLikedByForTask = (
  likedTaskKey: string,
  taskName: string,
  user: string,
  action: addAction,
): void => {
  const storedDataJSON = getLocalStorage(likedTaskKey);

  if (!storedDataJSON) {
    return;
  }

  Object.keys(storedDataJSON).forEach((dateKey) => {
    if (Array.isArray(storedDataJSON[dateKey])) {
      // Iterate over tasks for the specific date key
      storedDataJSON[dateKey] = storedDataJSON[dateKey].map(
        (task: { name: string; _liked_by: string[] }) => {
          let likedBy = task._liked_by;

          if (task.name === taskName) {
            if (!Array.isArray(likedBy)) {
              likedBy = JSON.parse(likedBy);
            }

            const userIndex = likedBy.indexOf(user);

            if (action === "Yes") {
              // Add user if not already in likedBy
              if (userIndex === -1) {
                likedBy.push(user);
              }
            } else if (action === "No") {
              // Remove user if exists in likedBy
              if (userIndex !== -1) {
                likedBy.splice(userIndex, 1);
              }
            }
          }

          return { ...task, _liked_by: likedBy };
        },
      );
    }
  });

  localStorage.setItem(likedTaskKey, JSON.stringify(storedDataJSON));
};
