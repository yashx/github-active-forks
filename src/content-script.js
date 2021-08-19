import { formatDistanceToNow, compareDesc } from "date-fns";

// Checking if there is a side panel on the page
const sidepanel = document.querySelector(
  "#repo-content-pjax-container > div > div.gutter-condensed.gutter-lg.flex-column.flex-md-row.d-flex > div.flex-shrink-0.col-12.col-md-3 > div"
);

if (sidepanel != null) {
  // Adding the container in which to add repository forks
  sidepanel.insertAdjacentHTML(
    "beforeend",
    '<div class="BorderGrid-row"> <div class="BorderGrid-cell"> <h2 class="h4 mb-3">Active Forks</h2><div id="active-forks"></div> </div></div>'
  );
  const activeForksContainer = document.getElementById("active-forks");

  // Getting owner/reponame from url
  let repo = window.location.href.replace("https://github.com/", "");

  // Getting and displaying repository forks
  getRepositoryForks(
    repo,
    (forks) => {
      chrome.storage.local.get("options", ({ options }) => {
        displayForks(
          options.display_count,
          options.sort_mode,
          forks,
          activeForksContainer
        );
      });
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.options?.newValue) {
          displayForks(
            changes.options.newValue.display_count,
            changes.options.newValue.sort_mode,
            forks,
            activeForksContainer
          );
        }
      });
    },
    (msg) => {
      displayError(msg, activeForksContainer);
    }
  );

  function getRepositoryForks(repo, onSuccess, onFail) {
    fetch(
      `https://api.github.com/repos/${repo}/forks?sort=stargazers&per_page=100`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then((data) => {
        if (data.length == 0) {
          onFail("No Forks found");
        } else {
          let forks = [];
          for (let fork of data) {
            fork.last_push_date = new Date(fork.pushed_at);
            fork.last_push_text = formatDistanceToNow(fork.last_push_date, {
              addSuffix: true,
            });

            forks.push(fork);
          }
          onSuccess(forks);
        }
      })
      .catch((e) => {
        onFail("Error in fetching forks");
      });
  }

  function displayError(msg, activeForksContainer) {
    removeAllChildNodes(activeForksContainer);
    activeForksContainer.insertAdjacentHTML("beforeend", getHtmlForError(msg));
  }

  function displayForks(display_count, sort_mode, forks, activeForksContainer) {
    removeAllChildNodes(activeForksContainer);
    let forks_to_display = forks.slice(0, display_count);
    // TODO sort
    if (sort_mode == "last_commit" || sort_mode == "forks") {
      forks_to_display.sort((f, s) => {
        switch (sort_mode) {
          case "forks":
            return forkCountCmp(f, s);
          case "last_commit":
            return compareDesc(f.last_push_date, s.last_push_date);
        }
      });
    }

    for (let fork of forks_to_display) {
      activeForksContainer.insertAdjacentHTML(
        "beforeend",
        getHtmlForFork(fork)
      );
    }
  }

  function forkCountCmp(f, s) {
    if (f.forks < s.forks) return +1;
    else if (f.forks > s.forks) return -1;
    else return 0;
  }

  function removeAllChildNodes(element) {
    while (element.firstChild) {
      element.removeChild(element.lastChild);
    }
  }
}

function getHtmlForError(msg) {
  /**
   * HTML to show if there is an error
   */
  return `
  <div
      class="text-small color-text-secondary"
    >
    ${msg}
    </div>
  `;
}

function getHtmlForFork(fork) {
  /**
   * HTML for an item in repository forks container
   */

  return `
  <div class="d-flex mt-2 fork">
    <span>
      <svg
        aria-hidden="true"
        height="16"
        viewBox="0 0 16 16"
        version="1.1"
        width="16"
        class="octicon octicon-repo mr-2 color-text-secondary"
      >
        <path
          fill-rule="evenodd"
          d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
        ></path>
      </svg>
    </span>
    <h4
      class="f4 color-text-secondary text-normal lh-condensed Truncate"
      title="${fork.full_name}"
    >
      <a href="/${fork.owner.login}" class="Truncate-text"> ${fork.owner.login} </a>
      &nbsp;/&nbsp;
      <span class="Truncate-text Truncate-text--primary">
        <a
          style="max-width: 240px"
          href="/${fork.full_name}"
          class="text-bold"
        >
          ${fork.name}
        </a>
      </span>
    </h4>
  </div>
  <div class="d-flex f6 color-text-secondary">
    <div class="mr-1 d-flex flex-items-center">
      <svg
        aria-hidden="true"
        height="12"
        viewBox="0 0 16 16"
        version="1.1"
        width="12"
        class="octicon octicon-star mr-1"
      >
        <path
          fill-rule="evenodd"
          d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
        ></path>
      </svg>
      ${fork.stargazers_count}
    </div>
    <div class="mr-1 d-flex flex-items-center">
      <svg
        aria-hidden="true"
        height="12"
        viewBox="0 0 16 16"
        version="1.1"
        width="12"
        class="octicon octicon-repo-forked ml-1 mr-1"
      >
        <path
          fill-rule="evenodd"
          d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
        ></path>
      </svg>
      ${fork.forks}
    </div>
    <div class="mr-1 d-flex flex-items-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        class="octicon octicon-repo-push ml-1 mr-1"
      >
        <path
          fill-rule="evenodd"
          d="M1 2.5A2.5 2.5 0 013.5 0h8.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V1.5h-8a1 1 0 00-1 1v6.708A2.492 2.492 0 013.5 9h3.25a.75.75 0 010 1.5H3.5a1 1 0 100 2h5.75a.75.75 0 010 1.5H3.5A2.5 2.5 0 011 11.5v-9zm13.23 7.79a.75.75 0 001.06-1.06l-2.505-2.505a.75.75 0 00-1.06 0L9.22 9.229a.75.75 0 001.06 1.061l1.225-1.224v6.184a.75.75 0 001.5 0V9.066l1.224 1.224z"
        ></path>
      </svg>
      ${fork.last_push_text}
    </div>
  </div>
    `;
}
