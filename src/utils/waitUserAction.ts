export function Countdown() {
  // 设置默认参数
  this.settings = {
    id: "canvas", // ID，canvas一定要有ID属性
    size: 130, // 绘制圆形的最大尺寸，宽=高
    borderWidth: 4, // 边框宽度
    borderColor: "#fff", // 边框颜色
    outerColor: "#fff", // 最外层底圆颜色
    scheduleColor: "#fff", // 进度条动画颜色
    fontColor: "#fff", // 字体颜色
    ringColor: "#ffc720", // 进度条环形颜色
    innerColor: "#4e84e5", // 最内圆底色
    fontSize: 50,
    time: 10,
  };
}

Countdown.prototype.init = function(opt) {
  this.obj = window.document.getElementById(this.settings.id);
  this.obj.width = this.settings.size;
  this.obj.height = this.settings.size;
  this.ctx = this.obj.getContext("2d");
  extend(this.settings, opt);
  this.countdown();
  this.callback = opt.callback;
};

Countdown.prototype.clear = function() {
  clearInterval(this.timer);
  this.ctx.clearRect(0, 0, this.obj.width, this.obj.height);


  this.ctx.clearRect(0, 0, this.obj.width, this.obj.height);
};

// 绘制底色
Countdown.prototype.drawBackground = function () {
  this.drawCircle(0, 360, 0, this.settings.outerColor);
};
// 绘制进度条动画背景
Countdown.prototype.drawProcess = function () {
  this.drawCircle(0, 360, 4, this.settings.ringColor);
};

// 绘制倒计时
Countdown.prototype.drawInner = function () {
  this.drawCircle(0, 360, 23, this.settings.innerColor);
  this.strokeBorder(this.settings.borderWidth);
};

// 绘制进度条动画
Countdown.prototype.drawAnimate = function () {
  // 旋转的角度
  let deg = Math.PI / 180;
  let v = this.schedule * 360,
    startAng = -90,
    endAng = -90 + v;

  this.ctx.beginPath();
  this.ctx.moveTo(this.settings.size / 2, this.settings.size / 2);
  this.ctx.arc(
    this.settings.size / 2,
    this.settings.size / 2,
    this.settings.size / 2 - 3,
    startAng * deg,
    endAng * deg,
    false
  );
  this.ctx.fillStyle = this.settings.scheduleColor;
  this.ctx.fill();
  this.ctx.closePath();
};
// 绘制边框
Countdown.prototype.strokeBorder = function (borderWidth) {
  this.ctx.lineWidth = borderWidth;
  this.ctx.strokeStyle = this.settings.borderColor;
  this.ctx.stroke();
};
// 绘制文字
Countdown.prototype.strokeText = function (text) {
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.font = this.settings.fontSize + "px" + " microsoft yahei";
  this.ctx.fillStyle = this.settings.fontColor;
  this.ctx.fillText(text, this.settings.size / 2, this.settings.size / 2);
};
// 绘制圆
Countdown.prototype.drawCircle = function (startAng, endAng, border, fillColor) {
  let deg = Math.PI / 180;
  this.ctx.beginPath();
  this.ctx.arc(
    this.settings.size / 2,
    this.settings.size / 2,
    this.settings.size / 2 - border,
    startAng * deg,
    endAng * deg,
    false
  );
  this.ctx.fillStyle = fillColor;
  this.ctx.fill();
  this.ctx.closePath();
};
// 进度条动画
Countdown.prototype.countdown = function () {
  let oldTime = +new Date();
  this.timer = setInterval(() => {
    let allMs = this.settings.time * 1000, // 如30*1000=30 000ms
      currentTime = +new Date();
    // 步长=（当前的时间-过去的时间）/总秒数
    let schedule = (currentTime - oldTime) / allMs;
    this.schedule = schedule;

    this.drawAll(schedule);
    if (currentTime - oldTime >= allMs) {
      // 重绘
      this.drawBackground();
      this.drawProcess();
      this.drawAnimate();
      this.drawInner();
      this.strokeText(0);
      clearInterval(this.timer);
      this.callback();
    }
  }, 100);
};

// 绘制所有
Countdown.prototype.drawAll = function (schedule) {
  schedule = schedule >= 1 ? 1 : schedule;
  let text = Math.floor(this.settings.time * (1 - schedule) + 1);
  // 清除画布
  this.ctx.clearRect(0, 0, this.settings.size, this.settings.size);
  this.drawBackground();
  this.drawProcess();
  this.drawAnimate();
  this.drawInner();
  this.strokeText(text);
};

Countdown.prototype.afterAction = function (action) {
  console.log("user choose " + action);
  this.clear();

  deleteButton();
  this.userAction = action;
};

Countdown.prototype.userCheck = function () {
  console.log("check");
  this.afterAction("check");
};
Countdown.prototype.userCall = function () {
  console.log("call");
  this.afterAction("call");
};
Countdown.prototype.userRaise = function () {
  console.log("raise");
  this.afterAction("raise");
};
Countdown.prototype.userFold = function () {
  console.log("fold");
  this.afterAction("fold");
};

// 对象拷贝
function extend(obj1, obj2) {
  for (let attr in obj2) {
    obj1[attr] = obj2[attr];
  }
}

function addButton(targetParentId, value, callback) {
  //使用DOM的创建元素方法
  var o = document.createElement("button");
  //o.type = "button";
  o.value = value;
  o.textContent = value;

  o.addEventListener("click", callback);
  var e = document.getElementById(targetParentId);
  e.appendChild(o);
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function deleteButton() {
  var e = document.getElementById("userButtons");
  removeAllChildNodes(e);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function updateUITitle(title) {
  var e = document.getElementById("whoisturn");
  e.textContent = title;
}
function updateResult(title) {
  var e = document.getElementById("whoisturnresult");
  e.textContent = title;
}

export async function waitForUserAction(userName, isMyTurn) {
  if (isMyTurn) {
    updateUITitle("Your turn: " + userName);

    var ctd = new Countdown();
    ctd.init({
      callback: function () {
        ctd.userFold();
      },
    });

    addButton("userButtons", "check", function () {
      ctd.userCheck();
    });
    addButton("userButtons", "call", function () {
      ctd.userCall();
    });
    addButton("userButtons", "raise", function () {
      ctd.userRaise();
    });
    addButton("userButtons", "fold", function () {
      ctd.userFold();
    });

    while (!ctd.userAction) {
      await sleep(50);
    }
    updateUITitle(userName + " choose " + ctd.userAction);
    return new Promise<string>((resolve) => {
      resolve(ctd.userAction);
    });
  } else {
    updateUITitle("Waiting player " + userName);
    //var ctd = new Countdown();
    //ctd.init({});
  }
}
