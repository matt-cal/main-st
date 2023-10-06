type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Create Favorite",
    endpoint: "/api/favorites",
    method: "POST",
    fields: { target: "input" },
  },
  {
    name: "Get Favorites",
    endpoint: "/api/favorites",
    method: "GET",
    fields: { owner: "input" },
  },
  {
    name: "Delete Favorite",
    endpoint: "/api/favorites/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Create Like",
    endpoint: "/api/likes/:postId",
    method: "POST",
    fields: { postId: "input", type: "input" },
  },
  {
    name: "Get User Likes",
    endpoint: "/api/user/:username/likes",
    method: "GET",
    fields: { type: "input", username: "input" },
  },
  {
    name: "Get Post Likes",
    endpoint: "/api/post/:postId/likes",
    method: "GET",
    fields: { type: "input", postId: "input" },
  },
  {
    name: "Did User Like",
    endpoint: "/api/user/liked/:postId",
    method: "GET",
    fields: { type: "input", postId: "input" },
  },
  {
    name: "Delete Like",
    endpoint: "/api/likes/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Update Like",
    endpoint: "/api/likes/:id",
    method: "PATCH",
    fields: { id: "input", type: "input" },
  },
  {
    name: "Create Tag",
    endpoint: "/api/tags",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Get Tags",
    endpoint: "/api/tags",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Delete Tag",
    endpoint: "/api/tags/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Tag Post",
    endpoint: "/api/posts/:id/:tag",
    method: "PATCH",
    fields: { tag: "input", id: "input" },
  },
  {
    name: "Get Tagged Posts",
    endpoint: "/api/tags/:tag/posts",
    method: "GET",
    fields: { tag: "input" },
  },
  {
    name: "Untag Post",
    endpoint: "/api/posts/:id/:tag",
    method: "DELETE",
    fields: { tag: "input", id: "input" },
  },
  {
    name: "Tag User",
    endpoint: "/api/users/:tag",
    method: "PATCH",
    fields: { tag: "input" },
  },
  {
    name: "Get Tagged Users",
    endpoint: "/api/tags/:tag/users",
    method: "GET",
    fields: { tag: "input" },
  },
  {
    name: "Untag User",
    endpoint: "/api/users/:tag",
    method: "DELETE",
    fields: { tag: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
