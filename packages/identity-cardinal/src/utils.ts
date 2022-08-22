export function apiBase(): string {
  return `https://api.cardinal.so`;
}

// from @cardinal/namespaces-components
export async function tryGetImageUrl(
  handle: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `${apiBase()}/twitter/proxy?url=https://api.twitter.com/2/users/by&usernames=${handle}&user.fields=profile_image_url`,
    );
    const json = (await response.json()) as {
      data: { profile_image_url: string }[];
    };
    return json?.data[0]?.profile_image_url.replace('_normal', '') as string;
  } catch (e) {
    console.log(e);
    return undefined;
  }
}
