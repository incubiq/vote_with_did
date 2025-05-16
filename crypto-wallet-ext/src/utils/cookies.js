
const getCookieName=() => {
  let cookieName="jwt_token_vote_with_did";
  const env = process.env.NODE_ENV
  if(env == "development"){
    cookieName="jwt_DEBUG_token_vote_with_did";
  }

  return cookieName;
}

const getTokenFromCookie = (cookies) => {
  if(cookies) {
    const regex = new RegExp(`${getCookieName()}=([^;]+)`);
    const match = cookies.match(regex);
    if (match) {
        return match[1];
    }  
  }
  return null;
}

export {
  getCookieName,
  getTokenFromCookie
}