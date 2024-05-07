function formatDate(date: Date, fmt: string) {
  const o: { [key: string]: number } = {
    "M+": date.getMonth() + 1, //月份   
    "d+": date.getDate(), //日   
    "h+": date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时   
    "H+": date.getHours(), //小时   
    "m+": date.getMinutes(), //分   
    "s+": date.getSeconds(), //秒   
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
    S: date.getMilliseconds() //毫秒   
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (let k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1
          ? o[k] + ""
          : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}

function getPageInfo() {
  const pageText = document.body.innerText.trim()
  const pageIcon = document.querySelector('link[rel="icon"]')?.getAttribute('href')
  const pageUrl = window.location.href
	const pageTitle = document.title
  return {
    text: pageText,
    icon: pageIcon,
    url: pageUrl,
		title: pageTitle,
		time: new Date().getTime(),
		id: getUUID(),
  }
}



function debounce(func: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
      timer = null
    }, delay)
  }
}


function getUUID() {
	return new Date().getTime().toString(32).slice(0,8)
}

export {
	getPageInfo,
	debounce,
	formatDate,
	getUUID,
}