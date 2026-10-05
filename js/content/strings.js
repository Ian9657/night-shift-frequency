// Every player-facing string, as [zh, en]. The font build reads this file to
// bake exactly the glyphs the game needs.
(function (root) {
  'use strict';
  const strings = {
    // Title and shell
    'title.name': ['夜班频率', 'NIGHT SHIFT FREQUENCY'],
    'title.place': ['低潮镇 · 港湾便利店 · 凌晨两点', 'LOWTIDE · HARBOR MART · 2 A.M.'],
    'title.start': ['开始上班', 'START SHIFT'],
    'ui.lang': ['中文 / EN', '中文 / EN'],
    'ui.soundOn': ['声音：开', 'SOUND: ON'],
    'ui.soundOff': ['声音：关', 'SOUND: OFF'],
    'ui.radioHint': ['点收音机可以换台', 'Click the radio to change station'],
    'title.hint': ['点击操作 · 声音会在开始后播放', 'Click to play · sound starts after you begin'],
    'end.title': ['夜班结束', 'SHIFT OVER'],
    'end.records': ['你留下的记录', 'WHAT YOU RECORDED'],
    'end.again': ['再上一班', 'ANOTHER SHIFT'],
    'end.note': ['换一种记法，电台会读到另一封信。', 'Record it differently and the radio reads another letter.'],

    // Items as the register names them
    'item.coffee': ['BOSS 黑咖啡', 'BOSS BLACK COFFEE'],
    'item.onigiri': ['金枪鱼饭团', 'TUNA ONIGIRI'],
    'item.bento': ['炸鸡便当', 'KARAAGE BENTO'],
    'item.tea': ['绿茶', 'GREEN TEA'],
    'item.water': ['矿泉水500ML', 'MINERAL WATER 500ML'],
    'item.sandwich': ['鸡蛋三明治', 'EGG SANDWICH'],
    'item.juice': ['橙汁', 'ORANGE JUICE'],
    'item.cola': ['可乐500ML', 'COLA 500ML'],
    'item.bread': ['牛奶面包', 'MILK BREAD'],
    'item.spareKey': ['备用钥匙', 'SPARE KEY'],

    // POS screen
    'pos.ready': ['就绪', 'READY'],
    'pos.waiting': ['等待商品', 'WAITING FOR ITEMS'],
    'pos.total': ['合计 {amount}', 'TOTAL {amount}'],
    'pos.items': ['{count} 件', '{count} ITEMS'],
    'pos.reading': ['读取中', 'READING'],
    'pos.cash': ['现金', 'CASH'],
    'pos.card': ['刷卡', 'CARD'],
    'pos.tap': ['手机', 'TAP'],
    'pos.rescanPending': ['需要复扫', 'RE-SCAN PENDING'],
    'pos.recordPending': ['点屏幕处理记录', 'TAP SCREEN: RECORD'],
    'pos.recordSaved': ['记录已保存', 'RECORD SAVED'],
    'pos.mismatch': ['登记与实物不符', 'ITEM / REGISTER DIFFER'],
    'pos.link': ['关联 #{order}', 'LINK #{order}'],
    'pos.closed': ['已交班', 'SHIFT CLOSED'],
    'pos.sales': ['销售 {amount}', 'SALES {amount}'],
    'pos.printReport': ['打印交班报表', 'PRINT SHIFT REPORT'],

    // Record panel on the POS
    'rec.title': ['REG#02 交易记录', 'REG#02 / TRANSACTION RECORD'],
    'rec.time': ['时间', 'TIME'],
    'rec.item': ['实物', 'ITEM'],
    'rec.register': ['登记', 'REGISTER'],
    'rec.rescan': ['复扫', 'RE-SCAN'],
    'rec.pending': ['未复扫', 'PENDING'],
    'rec.awaiting': ['等待扫描', 'AWAITING SCAN'],
    'rec.linked': ['关联交易 #{order}', 'LINKED SALE #{order}'],
    'rec.entry': ['记录', 'ENTRY'],
    'rec.origin': ['来源', 'ORIGIN'],
    'rec.verify': ['核对', 'VERIFY'],
    'rec.from': ['引用', 'FROM'],
    'rec.saved': ['已保存的记录', 'SAVED ENTRY'],
    'rec.preview': ['将保存为', 'WILL SAVE'],
    'rec.instruction': ['回到柜台，用扫码枪再扫一次。', 'Return to the counter and scan it again.'],
    'rec.choose': ['选择这笔交易的记录方式', 'Choose how to record this sale'],
    'rec.keep': ['保留登记', 'KEEP REGISTER ENTRY'],
    'rec.correct': ['改为实物', 'CORRECT TO ITEM'],
    'rec.linkedChoice': ['沿用 #{order} 的记录', 'USE ENTRY FROM #{order}'],
    'rec.independent': ['按本次扫描记录', 'USE THIS SCAN'],
    'rec.back': ['返回柜台', 'BACK TO COUNTER'],
    'rec.save': ['保存记录', 'SAVE RECORD'],
    'rec.close': ['关闭', 'CLOSE'],
    'rec.paid': ['已付款交易', 'PAID TRANSACTIONS'],
    'rec.none': ['暂无', 'NONE YET'],
    'rec.keys': ['↑↓ 选择 · 回车确认 · Esc 关闭', '↑↓ select · Enter confirm · Esc close'],
    'origin.REGISTER': ['登记', 'REGISTER'],
    'origin.MANUAL': ['人工', 'MANUAL'],
    'verify.AUTO': ['自动', 'AUTO'],
    'verify.CURRENT_SCAN': ['本次扫描', 'CURRENT SCAN'],
    'verify.LINKED_HISTORY': ['沿用旧记录', 'LINKED HISTORY'],

    // Shift report
    'report.title': ['交班报表', 'SHIFT REPORT'],
    'report.sales': ['销售额', 'SALES'],
    'report.orders': ['交易笔数', 'TRANSACTIONS'],
    'report.overrides': ['人工更正', 'MANUAL EDITS'],
    'report.links': ['沿用记录', 'LINKED ENTRIES'],
    'report.verified': ['本次扫描', 'CURRENT SCANS'],
    'report.continue': ['点击继续', 'Click to continue'],

    // Customer lines
    'say.cash': ['现金。', 'Cash.'],
    'say.card': ['刷卡。', 'Card.'],
    'say.tap': ['我用手机。', "I'll tap."],
    'say.noBag': ['不用袋子。', 'No bag.'],
    'say.earlyPayment': ['先扫这些吧。', 'These first.'],
    'say.earlyBag': ['还没好呢。', 'Not yet.'],
    'say.redundantScan': ['那个扫过了。', 'Same one.'],
    'say.earlyHeat': ['先结账吧。', 'After, yeah.'],
    'say.unneededHeat': ['那个不用热。', 'Not that one.'],
    'say.bagBeforeHeat': ['先热一下。', 'Hot first.'],
    'say.heatRequest': ['帮我热一下这个。', 'Heat this, please.'],
    'say.scanAfterPay': ['已经付过了。', 'Already paid.'],
    'say.rain1': ['雨还没停。', 'Still raining.'],
    'say.rain2': ['伞落在码头了。', 'Left my umbrella at the pier.'],
    'say.rainScan': ['买对了。', 'Good call.'],
    'say.rainExit': ['别淋着。', 'Stay dry.'],
    'say.boat1': ['刚下船，饿坏了。', 'Just off the boat. Starving.'],
    'say.boatExit': ['辛苦。', 'Cheers.'],
    'say.milk1': ['本来只想买牛奶的。', 'Only came in for milk.'],
    'say.milkScan': ['……牛奶忘拿了。', '...forgot the milk.'],
    'say.milkExit': ['我再进来一趟。', 'Back in a second.'],
    'say.awake1': ['睡不着。', "Couldn't sleep."],
    'say.radio1': ['你也在听夜航台？', 'You listening to Night Ferry too?'],
    'say.radioScan': ['阿岚的声音挺催眠的。', "Lan's voice puts me right out."],
    'say.radioExit': ['晚安。', 'Night.'],
    'say.tower1': ['对岸那盏红灯，又亮了。', "That red light across the bay's on again."],
    'say.towerExit': ['早点下班吧。', 'Get home early.'],
    'say.wen1': ['嗯，我到了。', "Yeah, I'm here."],
    'say.wen2': ['钥匙我放店里，你来拿就行。', "I'll leave the key at the shop. Just come get it."],
    'say.wenRescan': ['怎么了？', 'Something wrong?'],
    'say.wenSecondRescan': ['还在扫？', 'Still doing it?'],
    'say.wenConfirmEarly': ['再扫一次看看？', 'Run it again?'],
    'say.wenKeep': ['上面写的是……钥匙？', 'It says... key?'],
    'say.wenCorrect': ['这个还能改的吗？', 'You can change those?'],
    'say.wenExit': ['……嗯，放好了。', '...Yeah. It\'s here.'],
    'say.echo1': ['我来拿钥匙。', "I'm here for the key."],
    'say.echo2': ['她说放在这儿了。', 'She said she left it here.'],
    'say.echoScan': ['跟刚才那瓶一样。', 'Same one as before.'],
    'say.echoKeepLinked': ['那就是这一把。', "So that's the one."],
    'say.echoKeepIndependent': ['……又一把？', '...Another one?'],
    'say.echoCorrectLinked': ['只是可乐啊。', "It's just a cola."],
    'say.echoCorrectIndependent': ['它刚才还不是钥匙。', "It wasn't a key a minute ago."],
    'say.echoExit': ['……谢谢。', '...Thanks.'],

    // Radio: FM 87.6 Night Ferry, host Lan
    'radio.station': ['夜航台', 'NIGHT FERRY'],
    'radio.echoStation': ['？？？', '???'],
    'radio.intro1': ['这里是 FM 87.6 夜航台，我是阿岚。', "This is FM 87.6, Night Ferry. I'm Lan."],
    'radio.intro2': ['凌晨两点，还醒着的朋友，晚上好。', 'Two a.m. Good evening to everyone still awake.'],
    'radio.o1': ['今晚的雨会下到天亮。渡轮停航，码头的朋友辛苦了。', "Rain until dawn. The ferry's suspended — hang in there, dock crew."],
    'radio.o2': ['有位听众点了一首老歌，送给上夜班的便利店店员。', 'A listener requested an old song for the night clerk at the corner store.'],
    'radio.o3a': ['对岸的旧中继塔停用十二年了。', 'The old relay tower across the bay has been dead for twelve years.'],
    'radio.o3b': ['可每逢下雨，总有人说听见它在发报。', 'But on rainy nights, people swear they hear it transmitting.'],
    'radio.o4': ['失物招领：码头捡到一只黄雨靴，左脚。', 'Lost and found: one yellow rain boot at the pier. Left foot.'],
    'radio.o5a': ['下一条留言……', 'Next message...'],
    'radio.o5b': ['“备用钥匙我留在港湾便利店了，妹妹会去取。”', '"I left the spare key at Harbor Mart. My sister will pick it up."'],
    'radio.o5c': ['……这条留言没有署名。', "...It isn't signed."],
    'radio.o6a': ['抱歉，刚才信号有点乱。', 'Sorry — the signal got messy for a moment.'],
    'radio.o6b': ['如果你听到了别的台，那不是我们。', "If you heard another station, that wasn't us."],
    'radio.o7': ['雨小一点了。再坚持一会儿，天就亮了。', "Rain's easing. Hold on a little longer — it's nearly light."],
    'radio.o8a': ['我们又收到了那条留言，一字不差。', 'We got that message again. Word for word.'],
    'radio.o8b': ['只是这次，落款是她的妹妹。', "Only this time, it's signed by her sister."],
    'radio.endKeepLinked1': ['最后一封来信：“我拿到钥匙了。门开着，屋里亮着灯。”', 'One last letter: "I got the key. The door was open, the lights were on."'],
    'radio.endKeepLinked2': ['“姐姐坐在里面等我。她跟我长得一模一样。”', '"My sister was waiting inside. She looks exactly like me."'],
    'radio.endKeepIndependent1': ['最后一封来信：“现在有两把钥匙了。”', 'One last letter: "There are two keys now."'],
    'radio.endKeepIndependent2': ['“我们家只有一扇门。今晚，两边都有人回了家。”', '"Our house has one door. Tonight, someone came home on both sides."'],
    'radio.endCorrectLinked1': ['最后一封来信：“店员说，那只是一瓶可乐。”', 'One last letter: "The clerk said it was just a cola."'],
    'radio.endCorrectLinked2': ['“我在门口坐到了天亮。也许本来就没有钥匙。”', '"I sat at the door till morning. Maybe there never was a key."'],
    'radio.endCorrectIndependent1': ['最后一封来信：“钥匙找到了，门也开了。”', 'One last letter: "Found the key. The door opened."'],
    'radio.endCorrectIndependent2': ['“可我总觉得，那不是她留给我的那一把。”', '"But I keep thinking it isn\'t the one she left me."'],
    'radio.signoff': ['这里是夜航台。天亮了，晚安。', "This is Night Ferry. It's morning. Good night."],
    'radio.static': ['……沙沙……', '...kssshh...'],
    'radio.staticReg': ['……沙沙……REG#02……', '...kssshh... REG#02...'],
    'radio.echoRecord': ['REG#02，{time}，{label}，一件。', 'REG#02. {time}. {label}, one.'],
    'radio.echoOpposite': ['REG#02，02:41，{label}。来源：{origin}。', 'REG#02. 02:41. {label}. Origin: {origin}.'],
    'radio.echoDoor': ['她已经到门口了。', "She's at the door already."],
    'radio.tuned': ['FM {freq}', 'FM {freq}'],
  };

  let language = 'zh';
  function setLanguage(value) { language = value === 'en' ? 'en' : 'zh'; }
  function getLanguage() { return language; }
  function t(key, vars = {}) {
    const entry = strings[key];
    if (!entry) throw new Error('Missing string: ' + key);
    const text = entry[language === 'en' ? 1 : 0];
    // A variable written as '@key' is itself translated, so it follows language changes.
    return text.replace(/\{(\w+)\}/g, (_, name) => {
      const value = vars[name];
      return typeof value === 'string' && value.startsWith('@') ? t(value.slice(1)) : value ?? '';
    });
  }

  const api = { strings, t, setLanguage, getLanguage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).i18n = api;
})(globalThis);
