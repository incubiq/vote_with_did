
/*
 *    Date/time utilities 
 */

export const since = (_date) => {

  const now = new Date();  
  const seconds = Math.round(Math.abs(now - _date) / 1000);
  
  const levels = [
    {value: 1, name: 'second'},
    {value: 60, name: 'minute'}, 
    {value: 60*60, name: 'hour'},
    {value: 60*60*24, name: 'day'}, 
    {value: 60*60*24*7, name:'week'},
    {value: 60*60*24*7*4.35, name:'month'},
    {value: 60*60*24*7*4.35*12, name: 'year'}
  ];

  let strRet=null;
  for (let level of levels) {
    if (seconds > level.value) {
      const count = Math.round(seconds / level.value);  
      const txt = `${count} ${level.name}${count > 1 ? 's' : ''} ago`;
      strRet=txt;
    } 
  }
  return strRet;
}

export const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const strTime = hour+minute > 0? "@"+hour+":"+ minute: "";
  
  return `${day} ${month} ${year} ${strTime}`;
} 

export const getCurrencySign = (_cur) => {
  if(!_cur) {return ""}
  _cur=_cur.toLowerCase();
  if(_cur=="gbp") {return "£"}
  if(_cur=="usd") {return "$"}
  if(_cur=="eur") {return "€"}
  return "";
}

export const getHowLongUntil = (_date)=>  {
		const _dateTo=new Date(_date);
		const _dateFrom=new Date(new Date().toUTCString());
		const diffInMs = _dateTo - _dateFrom; // Difference in milliseconds
		const diffInDays = parseInt(diffInMs / (1000 * 60 * 60 * 24)); // Convert to days
		const diffInHours = parseInt(diffInMs / (1000 * 60 * 60 ));
		const diffInMin = parseInt(diffInMs / (1000 * 60  )); 

		if(diffInMs<0) return null;
		return diffInDays>1 ? diffInDays +" days": diffInHours> 1 ? diffInHours+" hours" : diffInMin>1? diffInMin+" minutes": "a few seconds";
}


/*
*   Clipboard
*/

export const async_copyToClipboard = async (_text) => {
  const clipboard = navigator? navigator.clipboard: null;
  if(!clipboard || !window) {
    return false;
  }

  try {
    if (document.hasFocus()) {
      await clipboard.writeText(_text);
      return true;
    }
    
    // Fallback to execCommand for unfocused documents
    const textArea = document.createElement('textarea');
    textArea.value = _text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
  catch (err) {
    return false;
  }
}

/*
*   Google Advert tracking
*/

export const reportGoogleAdsConversion = (url, _value) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    console.warn("gtag not loaded");
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: 'AW-880230135/-qCjCNSCqcAaEPf93KMD',
    value: _value,
    currency: 'GBP',
    event_callback: () => {
      if (url) window.location = url;
    }
  });
};