/**
 * app.js — Главный модуль интерфейса и бизнес-логики планера
 */

// =========================================================================
// Полная база ВСЕХ Emoji по категориям с двуязычным поиском (RU + EN)
// =========================================================================
const EMOJI_CATEGORIES = [
  { id: 'all', name: '🌟 Все' },
  { id: 'smileys', name: '😀 Смайлы' },
  { id: 'work', name: '💼 Работа' },
  { id: 'home', name: '🏠 Дом' },
  { id: 'food', name: '🍎 Еда' },
  { id: 'auto', name: '🚗 Авто' },
  { id: 'sport', name: '⚽ Спорт' },
  { id: 'nature', name: '🐶 Природа' },
  { id: 'symbols', name: '⭐ Символы' }
];

const EMOJI_DATABASE = [
  // --- РАБОТА, БИЗНЕС, ФИНАНСЫ, ТЕХНОЛОГИИ ---
  { e: '💼', cat: 'work', tags: 'портфель работа бизнес офис дело кейс work business office job case' },
  { e: '📁', cat: 'work', tags: 'папка проект файлы документы folder project files dir' },
  { e: '📂', cat: 'work', tags: 'папка открыть подпапка open folder subfolder' },
  { e: '📊', cat: 'work', tags: 'график статистика диаграмма отчет анализ chart graph report analytics' },
  { e: '📈', cat: 'work', tags: 'рост прибыль график тренд вверх growth profit trend up' },
  { e: '📉', cat: 'work', tags: 'спад убыток график вниз loss drop down' },
  { e: '📋', cat: 'work', tags: 'план задачи список чек-лист буфер планшет clipboard checklist tasks list' },
  { e: '📌', cat: 'work', tags: 'кнопка пин закрепить важное pin pushpin note notice' },
  { e: '📎', cat: 'work', tags: 'скрепка прикрепить вложение paperclip attach clip' },
  { e: '🖇️', cat: 'work', tags: 'скрепки цепь связь clips linked' },
  { e: '💻', cat: 'work', tags: 'ноутбук компьютер комп программирование код ноутбук laptop computer pc mac dev code' },
  { e: '🖥️', cat: 'work', tags: 'монитор компьютер рабочий стол desktop monitor computer screen' },
  { e: '📱', cat: 'work', tags: 'телефон мобильный смартфон звонок phone mobile smartphone call cell' },
  { e: '⌨️', cat: 'work', tags: 'клавиатура печать набор keyboard type typing' },
  { e: '🖱️', cat: 'work', tags: 'мышь клик компьютер mouse click pc' },
  { e: '🖨️', cat: 'work', tags: 'принтер печать документ printer print document' },
  { e: '📞', cat: 'work', tags: 'телефон трубка звонок созвон call phone dial' },
  { e: '📧', cat: 'work', tags: 'почта письмо емейл email mail letter inbox' },
  { e: '✉️', cat: 'work', tags: 'письмо конверт сообщение envelope mail letter message' },
  { e: '📦', cat: 'work', tags: 'посылка коробка доставка заказ package box delivery parcel' },
  { e: '📬', cat: 'work', tags: 'ящик почтовый письмо mailbox post' },
  { e: '🤝', cat: 'work', tags: 'сделка партнерство договор встреча handshake deal partner meet' },
  { e: '🏢', cat: 'work', tags: 'офис здание компания работа office building company work' },
  { e: '👔', cat: 'work', tags: 'галстук костюм рубашка работа dress suit tie shirt formal' },
  { e: '💰', cat: 'work', tags: 'деньги мешок валюта богатство money cash bag wealth dollar' },
  { e: '💳', cat: 'work', tags: 'карта оплата банк кредитка credit card payment bank pay' },
  { e: '💵', cat: 'work', tags: 'доллар деньги наличка кэш dollar cash money bill' },
  { e: '🪙', cat: 'work', tags: 'монета крипта золото coin crypto gold money' },
  { e: '💎', cat: 'work', tags: 'бриллиант алмаз ценность кристал diamond gem crystal luxury' },
  { e: '🧾', cat: 'work', tags: 'чек квитанция оплата налог receipt bill tax payment' },
  { e: '📑', cat: 'work', tags: 'закладки документы файлы tabs documents papers' },
  { e: '🏗️', cat: 'work', tags: 'стройка кран разработка building construction dev' },
  { e: '🏦', cat: 'work', tags: 'банк финансы кредит bank finance credit' },
  { e: '🏷️', cat: 'work', tags: 'тег метка цена ярлык tag label price' },
  { e: '💸', cat: 'work', tags: 'траты расход деньги улетели spending fly money cash expense' },
  { e: '🧮', cat: 'work', tags: 'калькулятор счет учет abacus calculate math count' },
  { e: '🖋️', cat: 'work', tags: 'ручка перо подпись договор pen signature contract write' },
  { e: '🖊️', cat: 'work', tags: 'ручка писать pen write draw' },
  { e: '🖌️', cat: 'work', tags: 'кисть дизайн рисовать brush paint art design' },
  { e: '🗂️', cat: 'work', tags: 'индекс картотека папки card index dividers files' },
  { e: '🗃️', cat: 'work', tags: 'коробка архив файлы file box archive' },
  { e: '🗄️', cat: 'work', tags: 'шкаф архив картотека file cabinet archive' },
  { e: '🗑️', cat: 'work', tags: 'корзина удалить мусор trash bin delete basket' },
  { e: '🔒', cat: 'work', tags: 'замок пароль закрыто защита lock password secure private' },
  { e: '🔓', cat: 'work', tags: 'открыто доступ пароль unlock open access' },
  { e: '🔑', cat: 'work', tags: 'ключ доступ пароль key access password secure' },
  { e: '🗝️', cat: 'work', tags: 'ключ старый секрет old key secret' },
  { e: '🔨', cat: 'work', tags: 'молоток инструмент работа hammer tool work build' },
  { e: '🛠️', cat: 'work', tags: 'инструменты ремонт настройки tools repair settings fix' },
  { e: '🔧', cat: 'work', tags: 'гаечный ключ починить wrench spanner fix repair' },
  { e: '🪛', cat: 'work', tags: 'отвертка ремонт screwdriver fix' },
  { e: '🪚', cat: 'work', tags: 'пила дерево ремонт saw wood cut' },
  { e: '🧰', cat: 'work', tags: 'ящик с инструментами toolbox tools' },
  { e: '🔬', cat: 'work', tags: 'микроскоп наука исследование microscope science research' },
  { e: '🔭', cat: 'work', tags: 'телескоп космос будущее telescope space stars' },
  { e: '📡', cat: 'work', tags: 'радар антенна связь спутник satellite dish radar network' },
  { e: '🧭', cat: 'work', tags: 'компас навигация направление compass navigate guide direction' },
  { e: '⚙️', cat: 'work', tags: 'настройки шестеренка опции gear settings options config' },
  { e: '📐', cat: 'work', tags: 'угольник чертеж дизайн ruler triangle design math' },
  { e: '📏', cat: 'work', tags: 'линейка длина замер ruler measure scale' },
  { e: '📍', cat: 'work', tags: 'метка локация место карта pin location place map' },
  { e: '✂️', cat: 'work', tags: 'ножницы резать вырезать scissors cut' },
  { e: '⚖️', cat: 'work', tags: 'весы правосудие юрист закон scales justice lawyer balance' },
  { e: '🧲', cat: 'work', tags: 'магнит притяжение magnet attract' },
  { e: '🪜', cat: 'work', tags: 'лестница карьера подъем ladder climb career' },

  // --- СМАЙЛЫ И ЭМОЦИИ ---
  { e: '😀', cat: 'smileys', tags: 'смайл улыбка радость grin happy smile' },
  { e: '😃', cat: 'smileys', tags: 'смайлик веселье радость happy smile' },
  { e: '😄', cat: 'smileys', tags: 'смех улыбка счастливый laugh happy' },
  { e: '😁', cat: 'smileys', tags: 'зубы улыбка beam happy' },
  { e: '😆', cat: 'smileys', tags: 'восторг смех радость laugh closed eyes' },
  { e: '😅', cat: 'smileys', tags: 'пот улыбка фух sweat smile phew' },
  { e: '🤣', cat: 'smileys', tags: 'ржу угар катаюсь от смеха rofl lol' },
  { e: '😂', cat: 'smileys', tags: 'слезы радости смех до слез joy tears' },
  { e: '🙂', cat: 'smileys', tags: 'легкая улыбка вежливость smile' },
  { e: '🙃', cat: 'smileys', tags: 'вверх ногами ирония шутка upside down' },
  { e: '🫠', cat: 'smileys', tags: 'тает жара неловко melting' },
  { e: '😉', cat: 'smileys', tags: 'подмигнуть намек wink' },
  { e: '😊', cat: 'smileys', tags: 'доброта румянец счастье blush' },
  { e: '😇', cat: 'smileys', tags: 'ангел невинный святой halo angel' },
  { e: '🥰', cat: 'smileys', tags: 'нежность любовь сердечки love cute' },
  { e: '😍', cat: 'smileys', tags: 'влюблен восторг любовь heart eyes' },
  { e: '🤩', cat: 'smileys', tags: 'звезды восторг вау star struck' },
  { e: '😘', cat: 'smileys', tags: 'поцелуй любовь чмок kiss' },
  { e: '😋', cat: 'smileys', tags: 'вкусно ням аппетит yummy' },
  { e: '😛', cat: 'smileys', tags: 'язык дразнить playful' },
  { e: '😜', cat: 'smileys', tags: 'подмигнуть язык шутка crazy' },
  { e: '🤪', cat: 'smileys', tags: 'безумие дикий веселый goofy wacky' },
  { e: '😝', cat: 'smileys', tags: 'смешно язык squint' },
  { e: '🤑', cat: 'smileys', tags: 'деньги бабло богач money rich' },
  { e: '🤗', cat: 'smileys', tags: 'обнимашки привет hugs' },
  { e: '🫡', cat: 'smileys', tags: 'салют честь принято salute' },
  { e: '🤔', cat: 'smileys', tags: 'думать размышления вопрос think' },
  { e: '🤫', cat: 'smileys', tags: 'тихо секрет молчи shh silence' },
  { e: '🫢', cat: 'smileys', tags: 'ой рот рукой gasp shocked' },
  { e: '🫡', cat: 'smileys', tags: 'есть принято честь salute' },
  { e: '🤨', cat: 'smileys', tags: 'подозрение бровь скептик raised brow' },
  { e: '😐', cat: 'smileys', tags: 'нейтрально покерфейс neutral' },
  { e: '😑', cat: 'smileys', tags: 'без эмоций покерфейс expressionless' },
  { e: '😶', cat: 'smileys', tags: 'молчание нет слов silent' },
  { e: '😏', cat: 'smileys', tags: 'ухмылка хитрость smirk' },
  { e: '😒', cat: 'smileys', tags: 'скука недовольство unamused' },
  { e: '🙄', cat: 'smileys', tags: 'закатить глаза ну да ну да roll eyes' },
  { e: '😬', cat: 'smileys', tags: 'зубы неловко cringe grimace' },
  { e: '🤥', cat: 'smileys', tags: 'ложь нос пиноккио liar' },
  { e: '😌', cat: 'smileys', tags: 'облегчение покой спокойствие relieved' },
  { e: '😔', cat: 'smileys', tags: 'грусть тоска задумчивость pensive' },
  { e: '😪', cat: 'smileys', tags: 'сонный капля устал sleepy' },
  { e: '🤤', cat: 'smileys', tags: 'слюнки вкусно drool' },
  { e: '😴', cat: 'smileys', tags: 'сон спать спокойной ночи sleep' },
  { e: '😷', cat: 'smileys', tags: 'маска болезнь врач mask sick' },
  { e: '🤒', cat: 'smileys', tags: 'температура градусник болезнь fever' },
  { e: '🤕', cat: 'smileys', tags: 'бинт рана болит hurt bandage' },
  { e: '🤢', cat: 'smileys', tags: 'тошнота плохо фу nausea' },
  { e: '🤮', cat: 'smileys', tags: 'рвота тошнит vomit' },
  { e: '🤧', cat: 'smileys', tags: 'чихать простуда sneeze' },
  { e: '🥵', cat: 'smileys', tags: 'жара горячо духота hot' },
  { e: '🥶', cat: 'smileys', tags: 'холод мороз замерз cold' },
  { e: '🥴', cat: 'smileys', tags: 'пьяный кружится голова woozy' },
  { e: '😵', cat: 'smileys', tags: 'шок нокаут dizzy' },
  { e: '🤯', cat: 'smileys', tags: 'взрыв мозга шок вау mind blown' },
  { e: '🤠', cat: 'smileys', tags: 'ковбой шляпа вестерн cowboy' },
  { e: '🥳', cat: 'smileys', tags: 'праздник др тусовка пати party celebration' },
  { e: '😎', cat: 'smileys', tags: 'круто очки босс стиль cool' },
  { e: '🤓', cat: 'smileys', tags: 'ботан зануда умник код nerd' },
  { e: '🧐', cat: 'smileys', tags: 'монокль знаток анализ monocle' },
  { e: '😕', cat: 'smileys', tags: 'растерянность смущение confused' },
  { e: '😟', cat: 'smileys', tags: 'беспокойство тревога worried' },
  { e: '🙁', cat: 'smileys', tags: 'грустно печально frown' },
  { e: '😮', cat: 'smileys', tags: 'вау открыт рот surprised' },
  { e: '😯', cat: 'smileys', tags: 'удивление ошеломлен hushed' },
  { e: '😲', cat: 'smileys', tags: 'шок изумление astonished' },
  { e: '😳', cat: 'smileys', tags: 'румянец шок смущение flushed' },
  { e: '🥺', cat: 'smileys', tags: 'умоляю мило слезки pleading' },
  { e: '🥹', cat: 'smileys', tags: 'слезы счастья растроган holding tears' },
  { e: '😨', cat: 'smileys', tags: 'страх испуг fearful' },
  { e: '😰', cat: 'smileys', tags: 'тревога холодный пот anxious' },
  { e: '😥', cat: 'smileys', tags: 'грусть облегчение sad phew' },
  { e: '😢', cat: 'smileys', tags: 'плакать слеза грустно crying' },
  { e: '😭', cat: 'smileys', tags: 'рыдать плач навзрыд loud cry' },
  { e: '😱', cat: 'smileys', tags: 'крик ужас страх scream' },
  { e: '😖', cat: 'smileys', tags: 'неприятно морщиться confounded' },
  { e: '😣', cat: 'smileys', tags: 'терпеть тяжело persevere' },
  { e: '😞', cat: 'smileys', tags: 'разочарование грустно disappointed' },
  { e: '😓', cat: 'smileys', tags: 'пот тяжело усталость sweat' },
  { e: '😩', cat: 'smileys', tags: 'усталость ныть weary' },
  { e: '😫', cat: 'smileys', tags: 'устал измотан tired' },
  { e: '😤', cat: 'smileys', tags: 'пар из носа упорство злой triumph' },
  { e: '😡', cat: 'smileys', tags: 'злость гнев ярость angry rage' },
  { e: '😠', cat: 'smileys', tags: 'сердитый недоволен angry' },
  { e: '🤬', cat: 'smileys', tags: 'мат ругань цензура swearing' },
  { e: '😈', cat: 'smileys', tags: 'черт дьявол хитрость devil' },
  { e: '👿', cat: 'smileys', tags: 'злой дьявол демон imp' },
  { e: '💀', cat: 'smileys', tags: 'череп скелет смерть угар skull dead' },
  { e: '☠️', cat: 'smileys', tags: 'кости пираты яд опасный crossbones' },
  { e: '💩', cat: 'smileys', tags: 'какашка прикол говно poop' },
  { e: '🤡', cat: 'smileys', tags: 'клоун цирк шут clown' },
  { e: '👻', cat: 'smileys', tags: 'призрак привидение ghost' },
  { e: '👽', cat: 'smileys', tags: 'инопланетянин нло alien' },
  { e: '🤖', cat: 'smileys', tags: 'робот бот ии технологии robot bot' },
  { e: '🙈', cat: 'smileys', tags: 'не вижу стыдно обезьянка see no evil' },
  { e: '🙉', cat: 'smileys', tags: 'не слышу обезьянка hear no evil' },
  { e: '🙊', cat: 'smileys', tags: 'не скажу молчу обезьянка speak no evil' },

  // --- ДОМ, БЫТ, ПОВСЕДНЕВНОСТЬ ---
  { e: '🏠', cat: 'home', tags: 'дом квартира здание жилье home house flat building' },
  { e: '🏡', cat: 'home', tags: 'дом дача сад коттедж house garden cottage home' },
  { e: '🛋️', cat: 'home', tags: 'диван мебель отдых гостиная sofa couch furniture living' },
  { e: '🛏️', cat: 'home', tags: 'кровать сон спальня bed sleep bedroom rest' },
  { e: '🚪', cat: 'home', tags: 'дверь вход выход door enter exit' },
  { e: '🧹', cat: 'home', tags: 'метла уборка чистота порядок broom clean sweeping chore' },
  { e: '🧺', cat: 'home', tags: 'стирка корзина белье laundry basket clothes wash' },
  { e: '🧽', cat: 'home', tags: 'губка мыть уборка посуда sponge wash clean dishes' },
  { e: '🛁', cat: 'home', tags: 'ванна купаться гигиена bathtub bath wash' },
  { e: '🚿', cat: 'home', tags: 'душ мыться вода shower wash clean' },
  { e: '🪴', cat: 'home', tags: 'растение цветок комнатный полить plant potted flower water' },
  { e: '🔌', cat: 'home', tags: 'вилка розетка электричество ток plug power electricity' },
  { e: '💡', cat: 'home', tags: 'лампочка идея свет инсайт light idea insight bulb' },
  { e: '🕯️', cat: 'home', tags: 'свеча уют романтика candle flame cozy' },
  { e: '🛒', cat: 'home', tags: 'корзина покупки магазин купить cart shopping store buy market' },
  { e: '🛍️', cat: 'home', tags: 'пакеты шопинг покупки shopping bags buy mall' },
  { e: '🍽️', cat: 'home', tags: 'тарелка посуда еда ужин обед plate dining food meal dinner' },
  { e: '🧼', cat: 'home', tags: 'мыло гигиена чистота soap hygiene clean wash' },
  { e: '🪑', cat: 'home', tags: 'стул кресло мебель chair seat furniture' },
  { e: '🪞', cat: 'home', tags: 'зеркало красота mirror look reflection' },
  { e: '🪟', cat: 'home', tags: 'окно проветрить window glass air' },
  { e: '🧳', cat: 'home', tags: 'чемодан багаж поездка отпуск luggage suitcase trip travel' },
  { e: '⏳', cat: 'home', tags: 'песочные часы время таймер ожидать hourglass time timer wait' },
  { e: '⌛', cat: 'home', tags: 'песочные часы время прошло hourglass done time' },
  { e: '⏰', cat: 'home', tags: 'будильник утро напоминание время alarm clock morning reminder' },
  { e: '⏱️', cat: 'home', tags: 'секундомер таймер время stopwatch timer time' },
  { e: '📅', cat: 'home', tags: 'календарь дата день встречи date calendar schedule day' },
  { e: '🗓️', cat: 'home', tags: 'календарь расписание планы schedule calendar plan' },
  { e: '📝', cat: 'home', tags: 'заметка текст писать список memo note write list text' },
  { e: '🔔', cat: 'home', tags: 'колокол звонок уведомление напоминание bell notification reminder' },

  // --- ЕДА И НАПИТКИ ---
  { e: '🍏', cat: 'food', tags: 'зеленое яблоко еда фрукт диета green apple food fruit diet' },
  { e: '🍎', cat: 'food', tags: 'красное яблоко фрукт еда red apple fruit food' },
  { e: '🍐', cat: 'food', tags: 'груша фрукт еда pear fruit food' },
  { e: '🍊', cat: 'food', tags: 'апельсин мандарин цитрус orange citrus fruit' },
  { e: '🍋', cat: 'food', tags: 'лимон кислый цитрус чай lemon sour citrus' },
  { e: '🍌', cat: 'food', tags: 'банан фрукт перекус banana fruit snack' },
  { e: '🍉', cat: 'food', tags: 'арбуз ягода лето watermelon melon summer' },
  { e: '🍇', cat: 'food', tags: 'виноград ягоды вино grapes berries wine' },
  { e: '🍓', cat: 'food', tags: 'клубника ягода сладко strawberry berry sweet' },
  { e: '🫐', cat: 'food', tags: 'черника голубика ягоды blueberries berry' },
  { e: '🍒', cat: 'food', tags: 'вишня черешня ягоды cherries berry' },
  { e: '🍑', cat: 'food', tags: 'персик фрукт peach fruit' },
  { e: '🥭', cat: 'food', tags: 'манго тропики фрукт mango fruit' },
  { e: '🍍', cat: 'food', tags: 'ананас тропики pineapple fruit' },
  { e: '🥥', cat: 'food', tags: 'кокос орех coconut' },
  { e: '🥝', cat: 'food', tags: 'киви фрукт kiwi fruit' },
  { e: '🍅', cat: 'food', tags: 'помидор томат овощ tomato vegetable' },
  { e: '🥑', cat: 'food', tags: 'авокадо пп диета салат avocado healthy salad' },
  { e: '🥦', cat: 'food', tags: 'брокколи овощи здоровье broccoli vegetable healthy' },
  { e: '🥒', cat: 'food', tags: 'огурец овощ салат cucumber vegetable' },
  { e: '🌶️', cat: 'food', tags: 'перец острый чили hot pepper chili spicy' },
  { e: '🫑', cat: 'food', tags: 'перец сладкий болгарский bell pepper' },
  { e: '🌽', cat: 'food', tags: 'кукуруза початок corn' },
  { e: '🥕', cat: 'food', tags: 'морковь овощ зрение carrot vegetable' },
  { e: '🥔', cat: 'food', tags: 'картошка картофель еда potato food' },
  { e: '🥐', cat: 'food', tags: 'круассан завтрак выпечка croissant bakery breakfast' },
  { e: '🥯', cat: 'food', tags: 'бейгл бублик bagel' },
  { e: '🍞', cat: 'food', tags: 'хлеб батон выпечка bread bakery' },
  { e: '🥖', cat: 'food', tags: 'багет батон хлеб baguette bread' },
  { e: '🥨', cat: 'food', tags: 'крендель брецель pretzel' },
  { e: '🧀', cat: 'food', tags: 'сыр сырок cheese' },
  { e: '🥚', cat: 'food', tags: 'яйцо завтрак egg breakfast' },
  { e: '🍳', cat: 'food', tags: 'яичница завтрак сковорода яйцо fried egg breakfast cook' },
  { e: '🥓', cat: 'food', tags: 'бекон мясо завтрак bacon meat' },
  { e: '🥩', cat: 'food', tags: 'мясо стейк ужин белков meat steak dinner protein' },
  { e: '🍗', cat: 'food', tags: 'курица ножка мясо обед chicken leg meat lunch' },
  { e: '🍖', cat: 'food', tags: 'мясо на кости meat bone' },
  { e: '🌭', cat: 'food', tags: 'хот-дог сосиска hot dog fast food' },
  { e: '🍔', cat: 'food', tags: 'бургер фастфуд булка котлета burger fast food beef' },
  { e: '🍟', cat: 'food', tags: 'картошка фри фастфуд french fries fast food' },
  { e: '🍕', cat: 'food', tags: 'пицца ужин доставка еда pizza dinner food delivery' },
  { e: '🥪', cat: 'food', tags: 'бутерброд сэндвич перекус sandwich snack lunch' },
  { e: '🥙', cat: 'food', tags: 'шаурма донер пита flatbread gyro' },
  { e: '🌮', cat: 'food', tags: 'тако мексика taco mexican' },
  { e: '🌯', cat: 'food', tags: 'буррито шаурма burrito roll' },
  { e: '🥗', cat: 'food', tags: 'салат зелень диета пп salad greens healthy diet' },
  { e: '🥘', cat: 'food', tags: 'паэлья сковорода ужин pan food' },
  { e: '🍝', cat: 'food', tags: 'паста спагетти макароны spaghetti pasta' },
  { e: '🍜', cat: 'food', tags: 'рамен лапша суп азия ramen noodles soup asia' },
  { e: '🍲', cat: 'food', tags: 'суп кастрюля обед горячее pot food soup stew hot' },
  { e: '🍣', cat: 'food', tags: 'суши роллы рыба япония sushi rolls fish japan' },
  { e: '🍱', cat: 'food', tags: 'бенто обед ланч bento lunch' },
  { e: '🥟', cat: 'food', tags: 'пельмени вареники дамплинг dumpling' },
  { e: '🍤', cat: 'food', tags: 'креветка жареная shrimp tempura' },
  { e: '🍚', cat: 'food', tags: 'рис чашка rice bowl' },
  { e: '🍦', cat: 'food', tags: 'мороженое рожок ice cream' },
  { e: '🍧', cat: 'food', tags: 'лед десерт shaved ice' },
  { e: '🍨', cat: 'food', tags: 'мороженое креманка ice cream' },
  { e: '🍩', cat: 'food', tags: 'пончик донат сладкое doughnut donut' },
  { e: '🍪', cat: 'food', tags: 'печенье печенька cookie' },
  { e: '🎂', cat: 'food', tags: 'торт день рождения праздник birthday cake celebration' },
  { e: '🍰', cat: 'food', tags: 'пирожное торт десерт cake sweet dessert' },
  { e: '🧁', cat: 'food', tags: 'капкейк кекс cupcake' },
  { e: '🥧', cat: 'food', tags: 'пирог выпечка pie bakery' },
  { e: '🍫', cat: 'food', tags: 'шоколад сладость плитка chocolate' },
  { e: '🍬', cat: 'food', tags: 'конфета сладость candy sweet' },
  { e: '🍭', cat: 'food', tags: 'леденец чупачупс lollipop' },
  { e: '🍿', cat: 'food', tags: 'попкорн кино фильм popcorn movie' },
  { e: '☕', cat: 'food', tags: 'кофе чашка утро перерыв капучино coffee cup morning break tea' },
  { e: '🫖', cat: 'food', tags: 'чайник чай заварить teapot tea brew' },
  { e: '🍵', cat: 'food', tags: 'зеленый чай матча чашка green tea matcha cup' },
  { e: '🧃', cat: 'food', tags: 'сок пакетик сок juice box drink' },
  { e: '🥤', cat: 'food', tags: 'напиток стакан соломка кола drink soda cup straw' },
  { e: '🧋', cat: 'food', tags: 'бабл ти чай с шариками boba bubble tea' },
  { e: '🍺', cat: 'food', tags: 'пиво кружка бар алкоголь beer mug pub drink alcohol' },
  { e: '🍻', cat: 'food', tags: 'пиво чокаться тост cheers beer' },
  { e: '🥂', cat: 'food', tags: 'бокалы тост шампанское праздник champagne toast cheers celebrate' },
  { e: '🍷', cat: 'food', tags: 'вино бокал ресторан ужин wine glass restaurant dinner' },
  { e: '🍸', cat: 'food', tags: 'коктейль мартини cocktail' },
  { e: '🍹', cat: 'food', tags: 'тропический коктейль tropical drink' },
  { e: '🍾', cat: 'food', tags: 'бутылка шампанское праздник bottle champagne open celebrate' },
  { e: '🧊', cat: 'food', tags: 'лед холод вода кубик ice cold water cube' },

  // --- ТРАНСПОРТ, ПУТЕШЕСТВИЯ, ГОРОДА ---
  { e: '🚗', cat: 'auto', tags: 'машина авто автомобиль поездка car automobile auto drive ride' },
  { e: '🚙', cat: 'auto', tags: 'внедорожник авто джип suv car drive' },
  { e: '🚕', cat: 'auto', tags: 'такси машина шашечки taxi cab car' },
  { e: '🚌', cat: 'auto', tags: 'автобус поездка транспорт bus transit travel' },
  { e: '🏎️', cat: 'auto', tags: 'гонка болид спорткар racing race car fast' },
  { e: '🚓', cat: 'auto', tags: 'полиция машина служба police cop car' },
  { e: '🚑', cat: 'auto', tags: 'скорая помощь больница врачи ambulance hospital emergency' },
  { e: '🚒', cat: 'auto', tags: 'пожарная машина огонь fire engine truck' },
  { e: '🚚', cat: 'auto', tags: 'грузовик доставка переезд truck delivery cargo' },
  { e: '🚛', cat: 'auto', tags: 'фура тягач lorry articulated truck' },
  { e: '🚜', cat: 'auto', tags: 'трактор поле ферма tractor' },
  { e: '🚲', cat: 'auto', tags: 'велосипед велик эко прогулка bicycle bike ride cycle' },
  { e: '🛴', cat: 'auto', tags: 'самокат кикшеринг scooter kick' },
  { e: '🛵', cat: 'auto', tags: 'мопед скутер доставка motor scooter' },
  { e: '🏍️', cat: 'auto', tags: 'мотоцикл байк скорость motorcycle motorbike bike' },
  { e: '🚨', cat: 'auto', tags: 'сирена тревога мигалка siren police emergency alarm' },
  { e: '🚂', cat: 'auto', tags: 'поезд паровоз вокзал train railway travel' },
  { e: '🚆', cat: 'auto', tags: 'поезд экспресс метро train railway transit' },
  { e: '🚇', cat: 'auto', tags: 'метро подземка транспорт metro subway underground' },
  { e: '✈️', cat: 'auto', tags: 'самолет полет отпуск аэропорт airplane flight plane travel airport' },
  { e: '🛫', cat: 'auto', tags: 'вылет взлет самолет departure flight take off' },
  { e: '🛬', cat: 'auto', tags: 'посадка прилет самолет arrival landing plane' },
  { e: '🚁', cat: 'auto', tags: 'вертолет полет helicopter copter fly' },
  { e: '🚀', cat: 'auto', tags: 'ракета старт запуск проект космос rocket launch startup fast' },
  { e: '🛸', cat: 'auto', tags: 'нло летающая тарелка ufo space' },
  { e: '⛵', cat: 'auto', tags: 'парусник яхта море лодка sailboat boat yacht sea' },
  { e: '🚤', cat: 'auto', tags: 'катер лодка скорость speedboat' },
  { e: '🚢', cat: 'auto', tags: 'корабль круиз лайнер ship cruise ocean sea' },
  { e: '⛽', cat: 'auto', tags: 'заправка бензин топливо gas station fuel petrol' },
  { e: '🚦', cat: 'auto', tags: 'светофор дорога правила traffic light road signal' },
  { e: '🗺️', cat: 'auto', tags: 'карта маршрут путешествия map world travel guide' },
  { e: '🏖️', cat: 'auto', tags: 'пляж море отпуск песок пляж beach umbrella sand ocean sea' },
  { e: '🏕️', cat: 'auto', tags: 'кемпинг палатка природа поход camping tent camp outdoor' },
  { e: '⛰️', cat: 'auto', tags: 'горы природа вершина поход mountain nature hill climb' },
  { e: '🏙️', cat: 'auto', tags: 'город небоскребы урбан city cityscape buildings' },
  { e: '🌅', cat: 'auto', tags: 'рассвет утро солнце sunrise morning sun dawn' },
  { e: '🌆', cat: 'auto', tags: 'закат вечер город sunset city evening dusk' },
  { e: '🌃', cat: 'auto', tags: 'ночь город звезды night with stars' },
  { e: '🏰', cat: 'auto', tags: 'замок крепость castle' },
  { e: '🗼', cat: 'auto', tags: 'башня эйфелева tokyo tower eiffel' },
  { e: '🗽', cat: 'auto', tags: 'статуя свободы нью-йорк liberty statue' },

  // --- СПОРТ, АКТИВНОСТИ, ХОББИ ---
  { e: '⚽', cat: 'sport', tags: 'футбол мяч игра soccer football ball game' },
  { e: '🏀', cat: 'sport', tags: 'баскетбол мяч игра basketball ball game' },
  { e: '🏈', cat: 'sport', tags: 'американский футбол rugby american football' },
  { e: '⚾', cat: 'sport', tags: 'бейсбол мяч baseball' },
  { e: '🎾', cat: 'sport', tags: 'теннис корт мяч tennis court ball' },
  { e: '🏐', cat: 'sport', tags: 'волейбол мяч volleyball' },
  { e: '🏉', cat: 'sport', tags: 'регби rugby' },
  { e: '🥏', cat: 'sport', tags: 'фрисби тарелка frisbee flying disc' },
  { e: '🎱', cat: 'sport', tags: 'бильярд 8 пул billiards 8 ball' },
  { e: '🏓', cat: 'sport', tags: 'настольный теннис пинг-понг ping pong' },
  { e: '🏸', cat: 'sport', tags: 'бадминтон воланчик badminton' },
  { e: '🏒', cat: 'sport', tags: 'хоккей шайба лед ice hockey' },
  { e: '🥊', cat: 'sport', tags: 'бокс перчатки бой boxing glove fight' },
  { e: '🥋', cat: 'sport', tags: 'единоборства карате дзюдо martial arts' },
  { e: '🎯', cat: 'sport', tags: 'дартс мишень цель точность target darts aim' },
  { e: '⛳', cat: 'sport', tags: 'гольф лунка golf' },
  { e: '🏹', cat: 'sport', tags: 'лук стрельба стрела archery bow' },
  { e: '🎣', cat: 'sport', tags: 'рыбалка удочка рыба fishing' },
  { e: '🤿', cat: 'sport', tags: 'дайвинг маска плавание diving mask' },
  { e: '🛹', cat: 'sport', tags: 'скейтборд скейт skateboard' },
  { e: '🛼', cat: 'sport', tags: 'ролики коньки roller skate' },
  { e: '⛸️', cat: 'sport', tags: 'фигурное катание коньки ice skate' },
  { e: '🎿', cat: 'sport', tags: 'лыжи снег горы ski snow' },
  { e: '🏂', cat: 'sport', tags: 'сноуборд зима snowboard' },
  { e: '🏋️', cat: 'sport', tags: 'спортзал штанга качалка тренировка gym weightlifter workout fitness' },
  { e: '🏃', cat: 'sport', tags: 'бег спорт пробежка кардио runner running jogging cardio' },
  { e: '🧘', cat: 'sport', tags: 'йога медитация растяжка спокойствие yoga meditation stretch zen' },
  { e: '🚴', cat: 'sport', tags: 'велосипед велик велоспорт cyclist bicycle bike ride' },
  { e: '🏊', cat: 'sport', tags: 'плавание бассейн пловец swimmer swimming pool' },
  { e: '🧗', cat: 'sport', tags: 'скалолазание альпинизм climbing' },
  { e: '🏆', cat: 'sport', tags: 'кубок победа чемпион награда trophy win champion award winner' },
  { e: '🥇', cat: 'sport', tags: 'медаль золото 1 место первое gold medal first place winner' },
  { e: '🥈', cat: 'sport', tags: 'медаль серебро 2 место silver medal second place' },
  { e: '🥉', cat: 'sport', tags: 'медаль бронза 3 место bronze medal third place' },
  { e: '🎖️', cat: 'sport', tags: 'орден медаль заслуги medal military reward' },
  { e: '🎮', cat: 'sport', tags: 'геймпад игра отдых консоль gamepad game play console' },
  { e: '🕹️', cat: 'sport', tags: 'джойстик аркада joystick' },
  { e: '🎲', cat: 'sport', tags: 'кубик кости настолка dice boardgame' },
  { e: '🧩', cat: 'sport', tags: 'пазл логика задача puzzle logic solve piece' },
  { e: '🎨', cat: 'sport', tags: 'палитра краски дизайн рисовать palette art design paint' },
  { e: '🎭', cat: 'sport', tags: 'театр маски искусство drama theatre' },
  { e: '🎬', cat: 'sport', tags: 'кино хлопушка фильм clapperboard movie' },
  { e: '🎤', cat: 'sport', tags: 'микрофон пение караоке microphone sing' },
  { e: '🎧', cat: 'sport', tags: 'наушники музыка трек headphones music' },
  { e: '🎼', cat: 'sport', tags: 'ноты музыка партитура musical score' },
  { e: '🎹', cat: 'sport', tags: 'пианино клавиши музыка piano keyboard' },
  { e: '🎸', cat: 'sport', tags: 'гитара рок музыка guitar rock' },
  { e: '📚', cat: 'sport', tags: 'книги учеба читать знания books study read learn library' },

  // --- ЖИВОТНЫЕ И ПРИРОДА ---
  { e: '🐶', cat: 'nature', tags: 'собака щенок пес питомец друг dog puppy pet animal friend' },
  { e: '🐱', cat: 'nature', tags: 'кот кошка котенок питомец мяу cat kitten kitty pet meow' },
  { e: '🐭', cat: 'nature', tags: 'мышь мышка mouse rat' },
  { e: '🐹', cat: 'nature', tags: 'хомяк грызун питомец hamster pet' },
  { e: '🐰', cat: 'nature', tags: 'кролик заяц пушистый rabbit bunny cute' },
  { e: '🦊', cat: 'nature', tags: 'лиса лисица хитрая fox animal cute' },
  { e: '🐻', cat: 'nature', tags: 'медведь мишка зверь bear animal cute' },
  { e: '🐼', cat: 'nature', tags: 'панда мишка китай panda bear cute' },
  { e: '🐨', cat: 'nature', tags: 'коала австралия koala animal' },
  { e: '🐯', cat: 'nature', tags: 'тигр полосатый кошка tiger cat animal' },
  { e: '🦁', cat: 'nature', tags: 'лев царь зверь lion king animal' },
  { e: '🐮', cat: 'nature', tags: 'корова молоко cow' },
  { e: '🐷', cat: 'nature', tags: 'свинья свинка pig' },
  { e: '🐸', cat: 'nature', tags: 'лягушка жаба ква frog animal' },
  { e: '🐵', cat: 'nature', tags: 'обезьяна мартышка monkey animal cute' },
  { e: '🐔', cat: 'nature', tags: 'курица петух chicken' },
  { e: '🐧', cat: 'nature', tags: 'пингвин птица антарктида penguin' },
  { e: '🐦', cat: 'nature', tags: 'птица птенец bird' },
  { e: '🐤', cat: 'nature', tags: 'цыпленок baby chick' },
  { e: '🦆', cat: 'nature', tags: 'утка селезень кря duck' },
  { e: '🦅', cat: 'nature', tags: 'орел птица хищник eagle' },
  { e: '🦉', cat: 'nature', tags: 'сова мудрость ночь owl' },
  { e: '🦇', cat: 'nature', tags: 'летучая мышь бэтмен bat' },
  { e: '🐺', cat: 'nature', tags: 'волк хищник лес wolf' },
  { e: '🐴', cat: 'nature', tags: 'лошадь конь скакун horse' },
  { e: '🦄', cat: 'nature', tags: 'единорог магия сказка unicorn magic fairy' },
  { e: '🐝', cat: 'nature', tags: 'пчела мед труд bee honey bug' },
  { e: '🐛', cat: 'nature', tags: 'гусеница жук caterpillar bug' },
  { e: '🦋', cat: 'nature', tags: 'бабочка красота лето butterfly insect fly' },
  { e: '🐌', cat: 'nature', tags: 'улитка медленно snail' },
  { e: '🐞', cat: 'nature', tags: 'божья коровка жук lady beetle' },
  { e: '🐜', cat: 'nature', tags: 'муравей труд ant' },
  { e: '🐢', cat: 'nature', tags: 'черепаха долголетие turtle' },
  { e: '🐍', cat: 'nature', tags: 'змея кобра snake' },
  { e: '🐙', cat: 'nature', tags: 'осьминог щупальца octopus' },
  { e: '🐬', cat: 'nature', tags: 'дельфин море dolphin' },
  { e: '🐳', cat: 'nature', tags: 'кит фонтан ocean whale' },
  { e: '🐟', cat: 'nature', tags: 'рыба море рыбалка fish' },
  { e: '🦈', cat: 'nature', tags: 'акула хищник море shark' },
  { e: '🌲', cat: 'nature', tags: 'елка дерево лес природа evergreen tree forest pine' },
  { e: '🌳', cat: 'nature', tags: 'дерево парк листва nature tree deciduous park' },
  { e: '🌴', cat: 'nature', tags: 'пальма тропики пляж остров palm tree tropical island beach' },
  { e: '🌵', cat: 'nature', tags: 'кактус пустыня cactus' },
  { e: '🌾', cat: 'nature', tags: 'колос пшеница зерно rice ear wheat' },
  { e: '🌿', cat: 'nature', tags: 'трава зелень лист herb leaf' },
  { e: '☘️', cat: 'nature', tags: 'трилистник клевер shamrock' },
  { e: '🍀', cat: 'nature', tags: 'четырехлистник удача клевер four leaf clover luck' },
  { e: '🍁', cat: 'nature', tags: 'клен лист осень maple leaf autumn' },
  { e: '🍂', cat: 'nature', tags: 'листопад осень fallen leaf' },
  { e: '🍃', cat: 'nature', tags: 'листья ветер flutter leaf' },
  { e: '🍄', cat: 'nature', tags: 'гриб мухомор mushroom' },
  { e: '🌸', cat: 'nature', tags: 'сакура вишня цветок весна cherry blossom flower spring pink' },
  { e: '🌹', cat: 'nature', tags: 'роза цветок романтика любовь rose flower love red' },
  { e: '🌺', cat: 'nature', tags: 'гибискус цветок тропики hibiscus flower' },
  { e: '🌻', cat: 'nature', tags: 'подсолнух солнце лето sunflower flower yellow sun' },
  { e: '🌼', cat: 'nature', tags: 'ромашка цветок ромашки blossom flower' },
  { e: '🌷', cat: 'nature', tags: 'тюльпан цветок весна tulip flower' },
  { e: '🌞', cat: 'nature', tags: 'солнце лето тепло день sun face summer warm' },
  { e: '🌙', cat: 'nature', tags: 'луна ночь сон полумесяц moon night crescent sleep' },
  { e: '🌍', cat: 'nature', tags: 'земля планета мир глобус earth planet globe world' },
  { e: '🌈', cat: 'nature', tags: 'радуга красиво цвета rainbow' },
  { e: '⚡', cat: 'nature', tags: 'молния энергия быстро гроза lightning bolt power' },
  { e: '🔥', cat: 'nature', tags: 'огонь пламя жара срочно fire flame hot' },
  { e: '❄️', cat: 'nature', tags: 'снежинка зима мороз snowflake cold snow' },

  // --- СИМВОЛЫ, ФЛАГИ, ЗНАКИ ---
  { e: '⭐', cat: 'symbols', tags: 'звезда избранное главное важное star favorite top best' },
  { e: '🌟', cat: 'symbols', tags: 'сияние звезда блеск glowing star shiny' },
  { e: '✨', cat: 'symbols', tags: 'блестки магия новый чисто sparks sparkles magic new clean' },
  { e: '💫', cat: 'symbols', tags: 'головокружение звезда стрела dizzy star' },
  { e: '💥', cat: 'symbols', tags: 'взрыв бум бам explosion boom' },
  { e: '❤️', cat: 'symbols', tags: 'сердце любовь красное red heart love like' },
  { e: '🧡', cat: 'symbols', tags: 'оранжевое сердце orange heart' },
  { e: '💛', cat: 'symbols', tags: 'желтое сердце yellow heart' },
  { e: '💚', cat: 'symbols', tags: 'зеленое сердце green heart' },
  { e: '💙', cat: 'symbols', tags: 'синее сердце blue heart' },
  { e: '💜', cat: 'symbols', tags: 'фиолетовое сердце purple heart' },
  { e: '🖤', cat: 'symbols', tags: 'черное сердце black heart' },
  { e: '🤍', cat: 'symbols', tags: 'белое сердце white heart' },
  { e: '🤎', cat: 'symbols', tags: 'коричневое сердце brown heart' },
  { e: '💔', cat: 'symbols', tags: 'разбитое сердце грусть broken heart' },
  { e: '💯', cat: 'symbols', tags: 'сто баллов идеально топ 100 hundred perfect score top' },
  { e: '💢', cat: 'symbols', tags: 'злость гнев символ anger symbol' },
  { e: '💬', cat: 'symbols', tags: 'речь диалог сообщение чат speech bubble chat' },
  { e: '💭', cat: 'symbols', tags: 'мысли облако думать thought bubble' },
  { e: '💤', cat: 'symbols', tags: 'сон храп устал zzz sleeping' },
  { e: '✅', cat: 'symbols', tags: 'галочка чек выполнено готово check mark done tick complete' },
  { e: '❌', cat: 'symbols', tags: 'крестик ошибка отмена cross mark cancel wrong' },
  { e: '⭕', cat: 'symbols', tags: 'круг обведено circle heavy' },
  { e: '🛑', cat: 'symbols', tags: 'стоп знак stop sign' },
  { e: '⛔', cat: 'symbols', tags: 'кирпич въезд запрещен no entry' },
  { e: '⚠️', cat: 'symbols', tags: 'внимание осторожно предупреждение warning alert' },
  { e: '🚨', cat: 'symbols', tags: 'сирена мигалка тревога police emergency light' },
  { e: '🚩', cat: 'symbols', tags: 'флаг отметка финиш старт flag mark finish start' },
  { e: '🏁', cat: 'symbols', tags: 'шахматный флаг финиш checkered flag' },
  { e: '🎌', cat: 'symbols', tags: 'флаги япония crossed flags' },
  { e: '🏴‍☠️', cat: 'symbols', tags: 'пиратский флаг череп pirate flag' },
  { e: '🇷🇺', cat: 'symbols', tags: 'россия флаг триколор russia russian flag' },
  { e: '🇺🇸', cat: 'symbols', tags: 'сша америка флаг usa united states flag' },
  { e: '🇬🇧', cat: 'symbols', tags: 'великобритания англия uk britain flag' },
  { e: '🇩🇪', cat: 'symbols', tags: 'германия флаг germany flag' },
  { e: '🇫🇷', cat: 'symbols', tags: 'франция флаг france flag' },
  { e: '🇯🇵', cat: 'symbols', tags: 'япония флаг japan flag' },
  { e: '🇨🇳', cat: 'symbols', tags: 'китай флаг china flag' },
  { e: '🇮🇹', cat: 'symbols', tags: 'италия флаг italy flag' },
  { e: '🇪🇸', cat: 'symbols', tags: 'испания флаг spain flag' },
  { e: '👑', cat: 'symbols', tags: 'корона лидер главный король crown king leader vip' },
  { e: '🎓', cat: 'symbols', tags: 'шапка диплом выпускник универ graduation cap degree student' }
];

const ALL_EMOJIS_LIST = EMOJI_DATABASE.map(item => item.e);

const App = {
  // Состояние данных
  data: {
    sections: [],
    tasks: [],
    completedTasks: [],
    settings: {
      theme: 'dark',
      soundEnabled: true,
      soundTone: 'digital',
      defaultSubtasksExpanded: 'collapsed' // 'collapsed' | 'expanded'
    }
  },

  // Текущее состояние отображения
  currentView: 'all', // 'all', 'today', 'archive', { type: 'tag', tag: '...' }, или { sectionId, projectId }
  currentSearchQuery: '',
  
  // Фильтры архива
  archiveFilters: {
    period: 'all',
    dateFrom: null,
    dateTo: null,
    sectionId: 'all',
    searchQuery: ''
  },

  // Временное состояние для новой задачи
  newTaskReminder: null,
  newTaskColor: '',

  // Состояние Drag-and-Drop
  draggedTaskId: null,

  // Состояние плавающего дока
  isTimerDockCollapsed: false,

  // Аудио контекст и состояние активного будильника
  audioCtx: null,
  activeAlarmTaskId: null,
  alarmIntervalTimer: null,

  // Текущая выбранная категория в пикере эмодзи
  emojiCurrentCategory: 'all',

  // Периоды и сроки
  periodOffset: 0,
  currentPeriodType: 'week', // 'week' | 'month'
  monthSubMode: 'next30',    // 'next30' | 'calendar'
  isUndatedSectionCollapsed: false,
  periodSearchQuery: '',
  newTaskDueDate: null,
  newTaskReminderTime: null,

  // Статистика времени и перерывы
  statsPeriod: 'today',      // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'specific'
  statsSpecificDate: null,
  statsSectionFilter: 'all',
  manualLogType: 'work',

  // Состояние Тайм-блокинга и Расписания (v1.0.67)
  timelineScale: 'week', // 'day' | 'week'
  timelineOffset: 0,
  timeline24h: { today: false, main: false },
  timelineExpandedRanges: {
    today: { min: null, max: null },
    main: { min: null, max: null }
  },
  timelineFilterSection: 'all',
  timelineFilterProject: 'all',
  timelineShowCompleted: false,
  todayTimelineMode: 'list', // 'list' | 'split'
  resizingTimelineBlock: null,
  sidebarCollapsed: false,
  activeColumnResizer: null,

  // Инициализация приложения
  async init() {
    this.initAudioContext();
    try {
      localStorage.removeItem('planer_webdav_config');
      localStorage.removeItem('planer_tasks_data');
    } catch (e) {}
    
    // Загрузка данных
    const loaded = await Storage.load();
    if (loaded) {
      this.data = loaded;
      if (!this.data.sections) this.data.sections = [];
      if (!this.data.tasks) this.data.tasks = [];
      if (!this.data.completedTasks) this.data.completedTasks = [];
      if (!this.data.timeLogs) this.data.timeLogs = [];
      if (!this.data.reminders) this.data.reminders = [];
      if (!this.data.settings) {
        this.data.settings = {
          theme: 'warm',
          soundEnabled: true,
          soundTone: 'digital',
          defaultSubtasksExpanded: 'collapsed',
          remindersInArchive: false
        };
      }
      if (this.data.settings.remindersInArchive === undefined) {
        this.data.settings.remindersInArchive = false;
      }
      if (!this.data.settings.hotkeys) {
        this.data.settings.hotkeys = {
          globalQuickCapture: 'Alt+Space',
          enabled: true,
          autoMinimize: true
        };
      }
      if (!this.data.settings.theme) {
        this.data.settings.theme = localStorage.getItem('planer_theme') || 'warm';
      }
    }

    // Нормализация структуры данных
    this.normalizeAllData();

    // Применение темы
    const activeTheme = localStorage.getItem('planer_theme') || this.data.settings?.theme || 'warm';
    this.applyTheme(activeTheme);
    if (this.data.settings) this.data.settings.theme = activeTheme;

    // Инициализация мульти-баз (Vaults)
    await this.initVaults();

    // Настройка селектов звука и подпунктов в настройках
    const toneSelect = document.getElementById('setting-sound-tone');
    if (toneSelect) toneSelect.value = this.data.settings.soundTone || 'digital';

    const subtasksDefaultSelect = document.getElementById('setting-default-subtasks');
    if (subtasksDefaultSelect) subtasksDefaultSelect.value = this.data.settings.defaultSubtasksExpanded || 'collapsed';

    // Настройка чекбоксов трея и автозапуска Windows
    const trayCheck = document.getElementById('setting-minimize-to-tray');
    if (trayCheck) {
      trayCheck.checked = this.data.settings.minimizeToTray !== false;
    }
    const autostartCheck = document.getElementById('setting-autostart-windows');
    if (autostartCheck && window.electronAPI?.getAutostartStatus) {
      window.electronAPI.getAutostartStatus().then(res => {
        if (res && res.success) {
          autostartCheck.checked = !!res.autostart;
        }
      });
    }

    // Подписка на тики таймера
    TimerEngine.subscribe(() => {
      this.updateTimerDisplays();
      this.renderFloatingTimerDock();
      if (this.currentView === 'stats' && this.statsPeriod === 'today') {
        this.updateLiveStatsKPI();
      }
    });

    // Подписка на завершенные сессии времени (задачи + перерывы)
    TimerEngine.onSessionCompleted((sessionData) => {
      this.handleSessionCompleted(sessionData);
    });

    // Санитизация данных: привязка sectionId к актуальной секции проекта
    if (Array.isArray(this.data.tasks)) {
      this.data.tasks.forEach(t => {
        if (t.projectId) {
          const info = this.findFolderInfo(t.projectId);
          if (info && info.section && t.sectionId !== info.section.id) {
            t.sectionId = info.section.id;
          }
        }
      });
    }

    // Загрузка сохраненного режима тайм-блокинга
    // Загрузка сохраненного состояния сайдбара и тайм-блокинга
    if (this.data.settings?.todayTimelineMode) {
      this.todayTimelineMode = this.data.settings.todayTimelineMode;
    }
    if (this.data.settings?.sidebarCollapsed) {
      this.toggleSidebar(true);
    }

    // Слушатели перемещения мыши для изменения размера блоков и ширины колонок
    window.addEventListener('mousemove', (e) => {
      this.onTimelineResizeMove(e);
      this.onColumnResizeMove(e);
    });
    window.addEventListener('mouseup', (e) => {
      this.onTimelineResizeEnd(e);
      this.onColumnResizeEnd(e);
    });

    // Закрытие поповера точной настройки интервала времени при клике вне его
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('timeline-interval-popover');
      if (popover && popover.style.display !== 'none' && !popover.contains(e.target)) {
        this.closeTimelineIntervalPopover();
      }
    });

    // Рендер боковой панели и интерфейса
    this.renderSidebar();
    this.populateProjectSelects();
    this.renderCurrentView();
    this.updateBadges();

    // Инициализация палитр эмодзи
    this.renderEmojiPicker('project-emoji-grid', 'modal-project-icon', '');
    this.renderEmojiPicker('section-emoji-grid', 'modal-section-icon', '');

    // Прямое назначение обработчиков для надежности
    this.bindEventListeners();

    // Запуск фонового планировщика уведомлений
    this.startNotificationScheduler();

    // Инициализация нейтрального слоя синхронизации (provider подключается отдельно)
    if (window.SyncEngine) {
      SyncEngine.init();
      SyncEngine.subscribe((info) => {
        this.updateSyncUI(info);
      });
      if (SyncEngine.isConfiguredAndEnabled()) {
        SyncEngine.sync({ silent: true });
      }
    }

    // Подписка на события от Electron (горячие клавиши, меню системного трея)
    if (window.electronAPI?.onTriggerQuickCapture) {
      window.electronAPI.onTriggerQuickCapture((data) => {
        this.onGlobalShortcutTriggered(data);
      });
    }
    if (window.electronAPI?.onOpenQuickCapture) {
      window.electronAPI.onOpenQuickCapture(() => {
        this.openQuickCaptureModal();
      });
    }
    if (window.electronAPI?.onTriggerBreakToggle) {
      window.electronAPI.onTriggerBreakToggle(() => {
        this.toggleBreak();
      });
    }

    // Обработка горячих клавиш внутри окна программы
    document.addEventListener('keydown', (e) => {
      // Игнорируем если идет интерактивная запись клавиши в настройках
      if (this.isRecordingHotkey) return;

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                      document.activeElement?.isContentEditable;

      const hk = this.data.settings?.hotkeys || {};
      const newTaskKey = hk.newTask || 'Ctrl+N';
      const searchKey = hk.searchTasks || 'Ctrl+F';
      const breakKey = hk.toggleBreak || 'Ctrl+B';
      const noteKey = hk.openNote || 'Ctrl+M';
      const expandKey = hk.toggleExpandAll || 'Ctrl+E';

      if (this.matchesHotkey(e, newTaskKey)) {
        e.preventDefault();
        this.openQuickCaptureModal();
      } else if (this.matchesHotkey(e, searchKey)) {
        e.preventDefault();
        let searchInput = null;
        if (this.currentView === 'archive') {
          searchInput = document.getElementById('archive-search-input');
        } else if (this.currentView === 'week' || this.currentView === 'month') {
          searchInput = document.getElementById('period-search-input');
        } else if (this.currentView === 'help') {
          searchInput = document.getElementById('help-search-input');
        } else {
          searchInput = document.getElementById('task-search-input') || document.getElementById('new-task-title');
        }
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (!isInput && this.matchesHotkey(e, breakKey)) {
        e.preventDefault();
        this.toggleBreak();
      } else if (!isInput && this.matchesHotkey(e, noteKey)) {
        e.preventDefault();
        const activeTaskId = this.data.tasks.find(t => !t.completed)?.id;
        if (activeTaskId) {
          this.openTaskNoteModal(activeTaskId);
        }
      } else if (!isInput && this.matchesHotkey(e, expandKey)) {
        e.preventDefault();
        this.toggleAllSubtasksExpand();
      } else if (e.key === 'Escape') {
        const quickModal = document.getElementById('modal-quick-capture');
        if (quickModal && quickModal.style.display !== 'none') {
          this.closeQuickCaptureModal();
        }
        const noteModal = document.getElementById('modal-task-note');
        if (noteModal && noteModal.style.display !== 'none') {
          this.closeTaskNoteModal();
        }
      }
    });

    // Отложенное обновление UI после завершения ввода текста при облачной синхронизации
    document.addEventListener('focusout', () => {
      if (this.hasPendingUIUpdate) {
        setTimeout(() => {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          const isUserTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
          if (!isUserTyping && this.hasPendingUIUpdate) {
            this.hasPendingUIUpdate = false;
            this.renderCurrentView();
          }
        }, 200);
      }
    });

    // Закрытие поповеров при клике снаружи
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('reminder-popover');
      const btn = document.getElementById('new-task-reminder-btn');
      if (popover && popover.classList.contains('show') && !btn.contains(e.target)) {
        popover.classList.remove('show');
      }

      const colorMenu = document.getElementById('new-task-color-menu');
      const colorBtn = document.getElementById('new-task-color-btn');
      if (colorMenu && colorMenu.classList.contains('show') && colorBtn && !colorBtn.contains(e.target)) {
        colorMenu.classList.remove('show');
      }

      const vaultsMenu = document.getElementById('vaults-dropdown-menu');
      const vaultsBtn = document.getElementById('sidebar-vault-badge');
      if (vaultsMenu && vaultsMenu.style.display !== 'none' && (!vaultsBtn || !vaultsBtn.contains(e.target)) && !vaultsMenu.contains(e.target)) {
        vaultsMenu.style.display = 'none';
      }

      if (!e.target.closest('#note-toolbar') && !e.target.closest('.note-popover')) {
        this.closeNotePopovers();
      }
    });

    // Обработка Drag & Drop и Paste картинок в окно редактирования
    const pasteZone = document.getElementById('task-modal-paste-zone');
    if (pasteZone) {
      pasteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pasteZone.classList.add('dragover');
      });
      pasteZone.addEventListener('dragleave', () => {
        pasteZone.classList.remove('dragover');
      });
      pasteZone.addEventListener('drop', (e) => {
        e.preventDefault();
        pasteZone.classList.remove('dragover');
        if (e.dataTransfer?.files?.length > 0) {
          this.handleDroppedFiles(e.dataTransfer.files);
        }
      });
    }

    document.addEventListener('paste', (e) => {
      const editModal = document.getElementById('modal-edit-task');
      if (editModal && editModal.style.display !== 'none') {
        this.handlePasteInTaskModal(e);
      }
    });

    console.log('Планер успешно инициализирован.');
  },

  // Проверка и нормализация дерева папок, подпунктов, описания и дат
  normalizeAllData() {
    const ensureChildren = (list) => {
      if (!list) return;
      list.forEach(item => {
        if (!item.children) item.children = [];
        ensureChildren(item.children);
      });
    };

    this.data.sections.forEach(sec => {
      if (!sec.projects) sec.projects = [];
      ensureChildren(sec.projects);
    });

    const isDefaultCollapsed = (this.data.settings.defaultSubtasksExpanded || 'collapsed') === 'collapsed';

    this.data.tasks.forEach(task => {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      if (!Array.isArray(task.attachments)) task.attachments = [];
      if (typeof task.description !== 'string') task.description = '';
      if (typeof task.noteHtml !== 'string') task.noteHtml = '';
      else if (task.noteHtml) task.noteHtml = this.sanitizeHtml(task.noteHtml);
      if (typeof task.noteText !== 'string') task.noteText = '';
      if (task.subtasksCollapsed === undefined) {
        task.subtasksCollapsed = isDefaultCollapsed;
      }
      if (task.descriptionCollapsed === undefined) {
        task.descriptionCollapsed = isDefaultCollapsed;
      }
      if (!task.dueDate && task.reminderTime) {
        task.dueDate = task.reminderTime.slice(0, 10);
      }
    });

    this.data.completedTasks.forEach(task => {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
      if (!Array.isArray(task.attachments)) task.attachments = [];
      if (typeof task.description !== 'string') task.description = '';
      if (typeof task.noteHtml !== 'string') task.noteHtml = '';
      else if (task.noteHtml) task.noteHtml = this.sanitizeHtml(task.noteHtml);
      if (typeof task.noteText !== 'string') task.noteText = '';
      if (!task.dueDate && task.reminderTime) {
        task.dueDate = task.reminderTime.slice(0, 10);
      }
    });

    if (!Array.isArray(this.data.reminders)) this.data.reminders = [];
    this.data.reminders.forEach(r => {
      if (!r.repeat) r.repeat = 'none';
      if (r.completed === undefined) r.completed = false;
      if (!r.color) r.color = '';
      if (!r.dueDate) r.dueDate = this.getLocalDateStr();
      if (r.hasTime === undefined) {
        r.hasTime = !!(r.time && r.dateTime);
      }
      if (r.hasTime) {
        if (!r.time) r.time = '12:00';
        if (!r.dateTime) r.dateTime = `${r.dueDate}T${r.time}:00`;
      } else {
        r.time = null;
        r.dateTime = null;
      }
      if (r.advanceMinutes === undefined) r.advanceMinutes = 0;
      if (r.advanceAlsoExact === undefined) r.advanceAlsoExact = true;
      if (r.advanceNotified === undefined) r.advanceNotified = false;
    });

    this.cleanupCorruptedAndBogusLogs();
  },

  cleanupCorruptedAndBogusLogs() {
    if (!Array.isArray(this.data.timeLogs)) {
      this.data.timeLogs = [];
      return;
    }

    // Удаляем любые синтетические и битые записи (созданные log-sync-, записи > 16 часов, или с перевернутым временем)
    this.data.timeLogs = this.data.timeLogs.filter(log => {
      if (!log || !log.id) return false;
      if (String(log.id).startsWith('log-sync-')) return false;

      if (log.startedAt && log.endedAt) {
        const s = new Date(log.startedAt).getTime();
        const e = new Date(log.endedAt).getTime();
        if (isNaN(s) || isNaN(e) || e <= s) return false;
        if (log.durationSeconds > 16 * 3600) return false;
      }

      return true;
    });

    // Очищаем старые служебные подписи в существующих логах
    this.data.timeLogs.forEach(l => {
      if (l.note === 'Выполненная задача' || l.note === 'Учтенное рабочее время') {
        l.note = '';
      }
    });

    // Синхронизируем timeSpentSeconds задач с реальными логами (если логи есть)
    const allTasks = [...(this.data.tasks || []), ...(this.data.completedTasks || [])];
    allTasks.forEach(t => {
      const taskLogs = this.data.timeLogs.filter(l => l.type === 'work' && l.taskId === t.id);
      if (taskLogs.length > 0) {
        const sumSec = taskLogs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        t.timeSpentSeconds = sumSec;
      }
    });
  },

  // Прямое связывание событий DOM
  bindEventListeners() {
    const addBtn = document.getElementById('btn-add-task');
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        this.addNewTask();
      };
    }

    const taskInput = document.getElementById('new-task-title');
    if (taskInput) {
      taskInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addNewTask();
        }
      };
    }

    const card = document.querySelector('.task-input-card');
    if (card) {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.input-controls') && !e.target.closest('button') && !e.target.closest('select')) {
          if (taskInput) taskInput.focus();
        }
      });
    }
  },

  // =========================================================================
  // Поиск и работа с вложенными папками (Tree Helpers)
  // =========================================================================
  findFolderInfo(folderId) {
    for (const section of this.data.sections) {
      const search = (list, parent) => {
        for (const item of list) {
          if (item.id === folderId) {
            return { folder: item, parentFolder: parent, section: section };
          }
          if (item.children && item.children.length > 0) {
            const found = search(item.children, item);
            if (found) return found;
          }
        }
        return null;
      };

      const res = search(section.projects || [], null);
      if (res) return res;
    }
    return null;
  },

  getAllChildFolderIds(folder) {
    let ids = [folder.id];
    if (folder.children && folder.children.length > 0) {
      folder.children.forEach(child => {
        ids = ids.concat(this.getAllChildFolderIds(child));
      });
    }
    return ids;
  },

  countTasksInFolderTree(sectionId, folder) {
    const allFolderIds = this.getAllChildFolderIds(folder);
    return this.data.tasks.filter(t => t.sectionId === sectionId && allFolderIds.includes(t.projectId) && !t.completed).length;
  },

  // =========================================================================
  // Хештеги (#) для задач
  // =========================================================================
  extractHashtags(text) {
    if (!text) return [];
    const regex = /#([\w\u0400-\u04FF\-_]+)/gi;
    const matches = text.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.slice(1).toLowerCase())));
  },

  formatTitleWithHashtags(title) {
    if (!title) return '';
    const escaped = this.escapeHtml(title);
    return escaped.replace(/#([\w\u0400-\u04FF\-_]+)/gi, (match, tag) => {
      return `<span class="task-hashtag" onclick="event.stopPropagation(); App.selectTagView('${tag}')">#${tag}</span>`;
    });
  },

  getAllUniqueTags() {
    const tagMap = new Map();
    this.data.tasks.filter(t => !t.completed).forEach(task => {
      const tags = this.extractHashtags(task.title);
      tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return tagMap;
  },

  selectTagView(tag) {
    this.selectView({ type: 'tag', tag: tag });
  },

  // =========================================================================
  // Управление подпунктами (Subtasks) и описанием (Description)
  // =========================================================================
  toggleTaskDescriptionCollapse(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.descriptionCollapsed = !task.descriptionCollapsed;
      this.saveData();
      this.renderCurrentView();
    }
  },

  toggleTaskSubtasksCollapse(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.subtasksCollapsed = !task.subtasksCollapsed;
      this.saveData();
      this.renderCurrentView();
    }
  },

  toggleTaskAttachmentsCollapse(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.attachmentsCollapsed = !task.attachmentsCollapsed;
      this.saveData();
      this.renderCurrentView();
    }
  },

  toggleSubtask(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const sub = task.subtasks.find(s => s.id === subtaskId);
      if (sub) {
        sub.completed = !sub.completed;
        task.updatedAt = new Date().toISOString();
        this.saveData();
        this.renderCurrentView();
      }
    }
  },

  quickAddSubtask(taskId, inputEl) {
    const text = inputEl.value.trim();
    if (!text) return;

    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!Array.isArray(task.subtasks)) task.subtasks = [];

    task.subtasks.push({
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      text: text,
      completed: false
    });

    task.subtasksCollapsed = false; // Держим открытым
    this.saveData();
    this.renderCurrentView();
  },

  expandAllSubtasks() {
    this.data.tasks.forEach(t => {
      t.subtasksCollapsed = false;
      t.descriptionCollapsed = false;
      t.attachmentsCollapsed = false;
    });
    this.saveData();
    this.renderCurrentView();
  },

  collapseAllSubtasks() {
    this.data.tasks.forEach(t => {
      t.subtasksCollapsed = true;
      t.descriptionCollapsed = true;
      t.attachmentsCollapsed = true;
    });
    this.saveData();
    this.renderCurrentView();
  },

  setDefaultSubtasksExpanded(val) {
    this.data.settings.defaultSubtasksExpanded = val;
    this.saveData();
  },

  // Форматирование бейджей срока и напоминания
  formatTaskDateBadge(task) {
    if (!task.dueDate && !task.reminderTime) return '';
    const dateStr = task.dueDate || (task.reminderTime ? this.getLocalDateStr(new Date(task.reminderTime)) : '');
    if (!dateStr) return '';

    const todayStr = this.getLocalDateStr();
    const d = this.parseLocalDate(dateStr);
    let dateDisplay = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    let isToday = dateStr === todayStr;
    let isOverdue = dateStr < todayStr;

    let badgeClass = 'tag-duedate';
    if (isToday) {
      badgeClass += ' is-today';
      dateDisplay = '📅 Сегодня';
    } else if (isOverdue) {
      badgeClass += ' is-overdue';
      dateDisplay = `⚠️ ${dateDisplay}`;
    } else {
      dateDisplay = `📅 ${dateDisplay}`;
    }

    let timeBadge = '';
    if (task.reminderTime) {
      const t = new Date(task.reminderTime);
      const timeStr = t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const advanceMins = parseInt(task.reminderAdvance, 10) || 0;
      const advShort = advanceMins > 0 ? ` (${this.formatAdvanceMinutesShort(advanceMins)})` : '';
      const advTitle = advanceMins > 0 ? ` (сигнал ${this.formatAdvanceMinutesShort(advanceMins)})` : '';
      timeBadge = `<span class="tag-reminder" title="Напоминание (Будильник): ${timeStr}${advTitle}">🔔 ${timeStr}${advShort}</span>`;
    }

    return `<span class="${badgeClass}" title="Срок выполнения">${dateDisplay}</span>${timeBadge}`;
  },

  // =========================================================================
  // Управление цветами задач
  // =========================================================================
  toggleColorDropdown(e, menuId) {
    e.stopPropagation();
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('show');
  },

  selectNewTaskColor(color) {
    this.newTaskColor = color;
    const dot = document.getElementById('new-task-color-dot');
    if (dot) {
      dot.style.backgroundColor = color || 'var(--text-muted)';
    }
    const menu = document.getElementById('new-task-color-menu');
    if (menu) menu.classList.remove('show');
  },

  selectTaskModalColor(color) {
    document.getElementById('modal-task-color').value = color;
    document.querySelectorAll('.color-palette-selector .color-chip').forEach(btn => {
      if (btn.getAttribute('data-color') === color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // =========================================================================
  // Полный пикер Emoji с категориями и двуязычным поиском
  // =========================================================================
  renderEmojiPicker(containerId, targetInputId, filterQuery = '', activeCat = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (activeCat !== null) {
      this.emojiCurrentCategory = activeCat;
    }

    const currentCat = this.emojiCurrentCategory || 'all';

    let matchedList = [];

    if (filterQuery && filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      matchedList = EMOJI_DATABASE.filter(item => {
        return item.tags.toLowerCase().includes(q) || item.e.includes(q);
      }).map(item => item.e);
    } else if (currentCat === 'all') {
      matchedList = ALL_EMOJIS_LIST;
    } else {
      matchedList = EMOJI_DATABASE.filter(item => item.cat === currentCat).map(item => item.e);
    }

    let tabsHtml = `<div class="emoji-cat-tabs" style="margin-bottom: 6px;">`;
    EMOJI_CATEGORIES.forEach(cat => {
      const isActive = (!filterQuery && cat.id === currentCat) ? 'active' : '';
      tabsHtml += `<button type="button" class="emoji-tab ${isActive}" onclick="App.selectEmojiCategory('${containerId}', '${targetInputId}', '${cat.id}')">${cat.name}</button>`;
    });
    tabsHtml += `</div>`;

    let gridHtml = `<div class="emoji-grid-inner" style="max-height: 180px;">`;
    if (matchedList.length === 0) {
      gridHtml += `<div style="grid-column: 1/-1; padding: 12px; color: var(--text-muted); font-size: 13px; text-align: center;">Ничего не найдено по запросу "${this.escapeHtml(filterQuery)}". Введите любой смайл прямо в поле ввода!</div>`;
    } else {
      matchedList.forEach(emoji => {
        gridHtml += `<button type="button" class="emoji-cell" onclick="App.selectEmoji('${targetInputId}', '${emoji}')">${emoji}</button>`;
      });
    }
    gridHtml += `</div>`;

    container.innerHTML = tabsHtml + gridHtml;
  },

  selectEmojiCategory(containerId, targetInputId, catId) {
    this.emojiCurrentCategory = catId;
    this.renderEmojiPicker(containerId, targetInputId, '', catId);
  },

  onSearchEmoji(query, containerId, targetInputId) {
    this.renderEmojiPicker(containerId, targetInputId, query);
  },

  selectEmoji(targetInputId, emoji) {
    const input = document.getElementById(targetInputId);
    if (input) {
      input.value = emoji;
      input.focus();
    }
  },

  // =========================================================================
  // Темы оформления и звуки
  // =========================================================================
  setTheme(themeName) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.theme = themeName;
    try {
      localStorage.setItem('planer_theme', themeName);
    } catch (e) {}
    this.applyTheme(themeName);
    this.saveData();

    document.querySelectorAll('.btn-theme').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-theme-${themeName}`);
    if (activeBtn) activeBtn.classList.add('active');
  },

  applyTheme(themeName) {
    const t = themeName || 'warm';
    document.body.className = `theme-${t}`;
    document.documentElement.className = `theme-${t}`;
    try {
      localStorage.setItem('planer_theme', t);
    } catch (e) {}
  },

  toggleSound(enabled) {
    this.data.settings.soundEnabled = enabled;
    this.saveData();
  },

  setSoundTone(tone) {
    this.data.settings.soundTone = tone;
    this.saveData();
  },

  testSoundTone() {
    const tone = document.getElementById('setting-sound-tone')?.value || 'digital';
    this.playTone(tone);
  },

  // =========================================================================
  // Синтезатор звуковых мелодий (Web Audio API)
  // =========================================================================
  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('AudioContext недоступен:', e);
    }
  },

  playTone(toneName) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      if (toneName === 'digital') {
        [0, 0.15, 0.35, 0.5].forEach(offset => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, now + offset);
          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } else if (toneName === 'bell') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const offset = i * 0.12;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.25, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.6);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.6);
        });
      } else if (toneName === 'pulse') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (toneName === 'zen') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (toneName === 'sonar') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {}
  },

  playChimeSound() {
    if (!this.data.settings.soundEnabled || !this.audioCtx) return;
    this.playTone('bell');
  },

  // =========================================================================
  // Непрерывный Будильник (Alarm System)
  // =========================================================================
  activeAlarmInfo: null, // { type: 'task' | 'reminder', id: string }

  formatAdvanceMinutes(mins) {
    mins = parseInt(mins, 10) || 0;
    if (mins === 5) return '5 минут';
    if (mins === 10) return '10 минут';
    if (mins === 15) return '15 минут';
    if (mins === 30) return '30 минут';
    if (mins === 60) return '1 час';
    if (mins === 120) return '2 часа';
    if (mins === 1440) return '1 день';
    if (mins >= 60) return `${Math.round(mins / 60)} ч`;
    return `${mins} мин`;
  },

  formatAdvanceMinutesShort(mins) {
    mins = parseInt(mins, 10) || 0;
    if (mins === 5) return 'за 5м';
    if (mins === 10) return 'за 10м';
    if (mins === 15) return 'за 15м';
    if (mins === 30) return 'за 30м';
    if (mins === 60) return 'за 1ч';
    if (mins === 120) return 'за 2ч';
    if (mins === 1440) return 'за 1д';
    if (mins >= 60) return `за ${Math.round(mins / 60)}ч`;
    return `за ${mins}м`;
  },

  triggerAlarm(item, type = 'task', options = {}) {
    const isAdvance = !!options.isAdvance;
    const advanceMins = parseInt(options.advanceMins, 10) || 0;
    const advanceText = this.formatAdvanceMinutes(advanceMins);

    this.activeAlarmInfo = { type, id: item.id, isAdvance, advanceMins };
    this.activeAlarmTaskId = type === 'task' ? item.id : null;

    if (window.electronAPI && window.electronAPI.bringToFront) {
      window.electronAPI.bringToFront();
    }

    const badgeEl = document.getElementById('alarm-modal-badge');
    const titleEl = document.getElementById('alarm-modal-task-title');
    const metaEl = document.getElementById('alarm-modal-meta');
    const subtitleEl = document.getElementById('alarm-modal-subtitle');

    if (badgeEl) {
      if (isAdvance) {
        badgeEl.textContent = `⏳ СКОРО: ЧЕРЕЗ ${advanceText.toUpperCase()}!`;
        badgeEl.classList.add('is-advance');
      } else {
        badgeEl.textContent = type === 'reminder' ? '🔔 НАПОМИНАНИЕ!' : '🔔 ВРЕМЯ ЗАДАЧИ!';
        badgeEl.classList.remove('is-advance');
      }
    }

    if (subtitleEl) {
      if (isAdvance) {
        subtitleEl.textContent = type === 'reminder'
          ? `У вас есть ${advanceText}, чтобы подготовиться к напоминанию.`
          : `У вас есть ${advanceText}, чтобы переключить контекст и подготовиться к задаче.`;
      } else {
        subtitleEl.textContent = 'Будильник звенит непрерывно. Выберите действие:';
      }
    }

    if (type === 'reminder') {
      const repeatText = item.repeat && item.repeat !== 'none' ? ` • Повтор: ${this.formatRepeatName(item.repeat)}` : '';
      const timeStr = item.time || '12:00';
      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification({
          title: isAdvance ? `⏳ Скоро (через ${advanceText})!` : '🔔 НАПОМИНАНИЕ!',
          body: isAdvance ? `${item.text} • в ${timeStr}` : item.text
        });
      }
      if (titleEl) titleEl.textContent = item.text;
      if (metaEl) {
        metaEl.textContent = isAdvance
          ? `🔔 Напоминание • Начало в ${timeStr} (через ${advanceText})${repeatText}`
          : `🔔 Напоминание • ${timeStr}${repeatText}`;
      }
    } else {
      let timeStr = '';
      if (item.reminderTime) {
        const d = new Date(item.reminderTime);
        timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }

      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification({
          title: isAdvance ? `⏳ Скоро (через ${advanceText})!` : '🔔 ВРЕМЯ ЗАДАЧИ!',
          body: isAdvance ? `${item.title} • в ${timeStr}` : item.title
        });
      }
      const folderInfo = this.findFolderInfo(item.projectId);
      const projName = folderInfo ? folderInfo.folder.name : 'Общие';
      const projIcon = folderInfo ? (folderInfo.folder.icon || '📂') : '📂';
      const secName = folderInfo ? folderInfo.section.name : 'Раздел';
      const secIcon = folderInfo ? (folderInfo.section.icon || '💼') : '💼';

      if (titleEl) titleEl.textContent = item.title;
      if (metaEl) {
        metaEl.textContent = isAdvance
          ? `${secIcon} ${secName} ➔ ${projIcon} ${projName} • Начало в ${timeStr} (через ${advanceText})`
          : `${secIcon} ${secName} ➔ ${projIcon} ${projName}${timeStr ? ' • ' + timeStr : ''}`;
      }
    }

    this.openModal('modal-alarm');

    this.stopAlarmSoundLoop();
    const tone = this.data.settings.soundTone || 'digital';
    
    if (this.data.settings.soundEnabled) {
      this.playTone(tone);
      this.alarmIntervalTimer = setInterval(() => {
        this.playTone(tone);
      }, 1800);
    }
  },

  stopAlarmSoundLoop() {
    if (this.alarmIntervalTimer) {
      clearInterval(this.alarmIntervalTimer);
      this.alarmIntervalTimer = null;
    }
  },

  dismissAlarm() {
    this.stopAlarmSoundLoop();
    this.closeModal('modal-alarm');
    this.activeAlarmTaskId = null;
    this.activeAlarmInfo = null;
  },

  snoozeAlarm(minutes) {
    this.stopAlarmSoundLoop();
    this.closeModal('modal-alarm');

    if (this.activeAlarmInfo) {
      if (this.activeAlarmInfo.type === 'reminder') {
        this.snoozeReminderQuick(this.activeAlarmInfo.id, minutes);
      } else if (this.activeAlarmInfo.type === 'task') {
        const task = this.data.tasks.find(t => t.id === this.activeAlarmInfo.id);
        if (task) {
          const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
          task.reminderTime = newTime;
          task.reminderNotified = false;
          task.advanceNotified = true; // При откладывании сигнал сработает в новое точное время
          this.saveData();
          this.renderCurrentView();
        }
      }
    }
    this.activeAlarmTaskId = null;
    this.activeAlarmInfo = null;
  },

  completeTaskFromAlarm() {
    const alarm = this.activeAlarmInfo;
    this.dismissAlarm();
    if (alarm) {
      if (alarm.type === 'reminder') {
        this.toggleReminderStatus(alarm.id);
      } else if (alarm.type === 'task') {
        this.completeTask(alarm.id);
      }
    }
  },

  startNotificationScheduler() {
    setInterval(() => {
      const now = Date.now();
      
      // 1. Проверка задач с напоминаниями
      let taskChanged = false;
      this.data.tasks.forEach(task => {
        if (task.completed || !task.reminderTime) return;

        const reminderTimestamp = new Date(task.reminderTime).getTime();
        if (isNaN(reminderTimestamp)) return;

        const advanceMins = parseInt(task.reminderAdvance, 10) || 0;

        // Опережающее напоминание (за X минут)
        if (advanceMins > 0 && !task.advanceNotified) {
          const advanceTimestamp = reminderTimestamp - (advanceMins * 60 * 1000);
          if (now >= advanceTimestamp && now < reminderTimestamp) {
            task.advanceNotified = true;
            taskChanged = true;
            this.triggerAlarm(task, 'task', { isAdvance: true, advanceMins: advanceMins });
            return;
          } else if (now >= reminderTimestamp) {
            // Если приложение запустили позже времени задачи, опережающее помечаем сработавшим
            task.advanceNotified = true;
            taskChanged = true;
          }
        }

        // Основное напоминание в точный момент времени
        const shouldNotifyExact = (advanceMins === 0) || (task.reminderAdvanceAlsoExact !== false);
        if (shouldNotifyExact && !task.reminderNotified) {
          if (now >= reminderTimestamp) {
            task.reminderNotified = true;
            task.advanceNotified = true;
            taskChanged = true;
            this.triggerAlarm(task, 'task', { isAdvance: false });
          }
        }
      });
      if (taskChanged) {
        this.saveData();
      }

      // 2. Проверка автономных напоминаний
      let remChanged = false;
      (this.data.reminders || []).forEach(rem => {
        if (rem.completed || !rem.hasTime || !rem.dateTime) return;

        const remTimestamp = new Date(rem.dateTime).getTime();
        if (isNaN(remTimestamp)) return;

        const advanceMins = parseInt(rem.advanceMinutes, 10) || 0;

        // Опережающее напоминание
        if (advanceMins > 0 && !rem.advanceNotified) {
          const advanceTimestamp = remTimestamp - (advanceMins * 60 * 1000);
          if (now >= advanceTimestamp && now < remTimestamp) {
            rem.advanceNotified = true;
            remChanged = true;
            this.triggerAlarm(rem, 'reminder', { isAdvance: true, advanceMins: advanceMins });
            return;
          } else if (now >= remTimestamp) {
            rem.advanceNotified = true;
            remChanged = true;
          }
        }

        // Основное напоминание в точный момент
        const shouldNotifyExact = (advanceMins === 0) || (rem.advanceAlsoExact !== false);
        if (shouldNotifyExact && !rem.notified) {
          if (now >= remTimestamp) {
            rem.notified = true;
            rem.advanceNotified = true;
            remChanged = true;
            this.triggerAlarm(rem, 'reminder', { isAdvance: false });
          }
        }
      });
      if (remChanged) {
        this.saveData();
      }

      // 3. Обновление линии текущего времени на таймлайне
      this.updateTimelineNowLine();
    }, 3000);
  },

  // =========================================================================
  // Сохранение данных
  // =========================================================================
  async saveData() {
    this.data.localModifiedAt = new Date().toISOString();
    await Storage.save(this.data);
    this.updateBadges();
    if (window.SyncEngine) {
      SyncEngine.scheduleAutoSync(2500);
    }
  },

  // =========================================================================
  // Рендеринг боковой панели (Sidebar)
  // =========================================================================
  renderSidebar() {
    const container = document.getElementById('sections-container');
    if (!container) return;

    let html = '';

    this.data.sections.forEach(section => {
      const isCollapsed = section.collapsed ? 'collapsed' : '';
      const totalSectionTasks = this.data.tasks.filter(t => t.sectionId === section.id && !t.completed).length;
      const isSecActive = (typeof this.currentView === 'object' && this.currentView.sectionId === section.id && !this.currentView.projectId) ? 'active' : '';

      html += `
        <div class="section-block ${isCollapsed}" id="section-block-${section.id}">
          <div class="section-header ${isSecActive}">
            <div class="section-title-wrap" onclick="App.selectView({ sectionId: '${section.id}' })" style="cursor: pointer; flex: 1;" title="Показать все задачи раздела «${this.escapeHtml(section.name)}»">
              <span class="section-toggle-icon" onclick="event.stopPropagation(); App.toggleSectionCollapse('${section.id}')">${section.collapsed ? '▸' : '▾'}</span>
              <span>${section.icon || '📁'}</span>
              <span>${this.escapeHtml(section.name)}</span>
            </div>
            <div class="section-actions-wrap">
              <span class="badge" title="Задач в разделе">${totalSectionTasks}</span>
              <button class="section-actions-btn" title="Добавить основную папку" onclick="event.stopPropagation(); App.openAddProjectModal('${section.id}')">➕</button>
              <button class="section-actions-btn" title="Редактировать раздел" onclick="event.stopPropagation(); App.openEditSectionModal('${section.id}')">✏️</button>
            </div>
          </div>
          
          <div class="section-projects-list">
      `;

      // Рекурсивный рендер папок и подпапок
      const renderFolderTree = (folders, level = 0) => {
        let treeHtml = '';
        folders.forEach(folder => {
          const hasChildren = folder.children && folder.children.length > 0;
          const isFolderCollapsed = folder.collapsed ? true : false;
          const folderTasks = this.countTasksInFolderTree(section.id, folder);
          const directTasks = this.data.tasks.filter(t => t.sectionId === section.id && t.projectId === folder.id && !t.completed).length;
          
          const isActive = (typeof this.currentView === 'object' && this.currentView.sectionId === section.id && this.currentView.projectId === folder.id) ? 'active' : '';
          const folderIcon = folder.icon || '📂';
          const paddingLeft = 8 + (level * 14);

          treeHtml += `
            <div class="project-item ${isActive}" style="padding-left: ${paddingLeft}px;" onclick="App.selectView({ sectionId: '${section.id}', projectId: '${folder.id}' })">
              ${hasChildren ? `
                <span class="project-toggle-sub" onclick="event.stopPropagation(); App.toggleFolderCollapse('${section.id}', '${folder.id}')">
                  ${isFolderCollapsed ? '▸' : '▾'}
                </span>
              ` : `<span style="width: 14px;"></span>`}

              <span class="nav-icon">${folderIcon}</span>
              <span class="nav-label" title="${this.escapeHtml(folder.name)}">${this.escapeHtml(folder.name)}</span>
              <span class="badge" title="${directTasks} в папке, всего ${folderTasks}">${folderTasks}</span>

              <div class="project-actions-btns">
                <button class="project-add-sub-btn" title="Добавить подпапку внутрь" onclick="event.stopPropagation(); App.openAddProjectModal('${section.id}', '${folder.id}')">➕</button>
                <button class="project-edit-btn" title="Редактировать / переименовать" onclick="event.stopPropagation(); App.openEditProjectModal('${section.id}', '${folder.id}')">✏️</button>
              </div>
            </div>
          `;

          if (hasChildren && !isFolderCollapsed) {
            treeHtml += renderFolderTree(folder.children, level + 1);
          }
        });
        return treeHtml;
      };

      if (section.projects && section.projects.length > 0) {
        html += renderFolderTree(section.projects, 0);
      }

      html += `
            <button class="btn-add-project-row" onclick="App.openAddProjectModal('${section.id}')">
              <span>+</span> Создать папку
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.renderSidebarTags();
  },

  renderSidebarTags() {
    const tagsBlock = document.getElementById('tags-sidebar-block');
    const cloud = document.getElementById('sidebar-tags-cloud');
    if (!tagsBlock || !cloud) return;

    const tagMap = this.getAllUniqueTags();

    if (tagMap.size === 0) {
      tagsBlock.style.display = 'none';
      return;
    }

    tagsBlock.style.display = 'block';
    let html = '';

    tagMap.forEach((count, tag) => {
      const isActive = (typeof this.currentView === 'object' && this.currentView.type === 'tag' && this.currentView.tag === tag) ? 'active' : '';
      html += `
        <span class="tag-chip ${isActive}" onclick="App.selectTagView('${tag}')">
          #${this.escapeHtml(tag)} <span class="tag-chip-count">(${count})</span>
        </span>
      `;
    });

    cloud.innerHTML = html;
  },

  toggleSectionCollapse(sectionId) {
    const section = this.data.sections.find(s => s.id === sectionId);
    if (section) {
      section.collapsed = !section.collapsed;
      this.saveData();
      this.renderSidebar();
    }
  },

  toggleFolderCollapse(sectionId, folderId) {
    const info = this.findFolderInfo(folderId);
    if (info && info.folder) {
      info.folder.collapsed = !info.folder.collapsed;
      this.saveData();
      this.renderSidebar();
    }
  },

  // Локальные методы работы с датами (без погрешностей UTC)
  getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getLocalDatePlusDays(days, fromDate = new Date()) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + days, 12, 0, 0);
    return this.getLocalDateStr(d);
  },

  getLocalMonthStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length < 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  },

  // =========================================================================
  // Обновление бейджей (Все, Сегодня, Неделя, Месяц, Архив)
  // =========================================================================
  updateBadges() {
    const activeTasks = this.data.tasks.filter(t => !t.completed);
    const todayStr = this.getLocalDateStr();
    const todayTasks = activeTasks.filter(t => {
      const d = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
      return d === todayStr;
    });

    // Задачи на текущую неделю
    const currentWeekDays = this.getWeekDays(0).map(d => d.dateStr);
    const weekTasks = activeTasks.filter(t => {
      const d = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
      return d && currentWeekDays.includes(d);
    });

    // Задачи на месяц (ближайшие 30 дней от сегодня или текущий месяц)
    const dateLimit30 = this.getLocalDatePlusDays(30);
    const currentMonthPrefix = this.getLocalMonthStr();
    const monthTasks = activeTasks.filter(t => {
      const d = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
      return d && ((d >= todayStr && d <= dateLimit30) || d.startsWith(currentMonthPrefix));
    });

    const badgeAll = document.getElementById('badge-all-count');
    if (badgeAll) badgeAll.textContent = activeTasks.length;

    const badgeToday = document.getElementById('badge-today-count');
    if (badgeToday) badgeToday.textContent = todayTasks.length;

    const badgeWeek = document.getElementById('badge-week-count');
    if (badgeWeek) badgeWeek.textContent = weekTasks.length;

    const badgeMonth = document.getElementById('badge-month-count');
    if (badgeMonth) badgeMonth.textContent = monthTasks.length;

    const badgeReminders = document.getElementById('badge-reminders-count');
    if (badgeReminders) {
      const activeRemindersCount = (this.data.reminders || []).filter(r => !r.completed).length;
      badgeReminders.textContent = activeRemindersCount;
    }

    const badgeArchive = document.getElementById('badge-archive-count');
    if (badgeArchive) badgeArchive.textContent = this.data.completedTasks.length;

    const badgeTimeline = document.getElementById('badge-timeline-count');
    if (badgeTimeline) {
      const scheduledTasksCount = activeTasks.filter(t => t.timeBlock && t.timeBlock.date).length;
      if (scheduledTasksCount > 0) {
        badgeTimeline.textContent = scheduledTasksCount;
        badgeTimeline.style.display = 'inline-block';
      } else {
        badgeTimeline.style.display = 'none';
      }
    }
  },

  // Заполнение селектов проектов для форм
  populateProjectSelects(explicitModalVal = null) {
    const mainSelect = document.getElementById('new-task-project-select');
    const modalSectionSelect = document.getElementById('modal-project-section-select');
    const taskModalSelect = document.getElementById('modal-task-project-select');
    const archiveSectionFilter = document.getElementById('archive-section-filter');

    let options = '';
    this.data.sections.forEach(sec => {
      if (sec.projects && sec.projects.length > 0) {
        options += `<optgroup label="${sec.icon || '📁'} ${sec.name}">`;
        
        const buildFolderOptions = (folders, indent = '') => {
          folders.forEach(f => {
            options += `<option value="${sec.id}:::${f.id}">${indent}${f.icon || '📂'} ${f.name}</option>`;
            if (f.children && f.children.length > 0) {
              buildFolderOptions(f.children, indent + '　└ ');
            }
          });
        };

        buildFolderOptions(sec.projects);
        options += `</optgroup>`;
      }
    });

    if (mainSelect) {
      const prevVal = mainSelect.value;
      mainSelect.innerHTML = options || '<option value="default">Без проекта</option>';
      if (typeof this.currentView === 'object' && this.currentView.sectionId && this.currentView.projectId) {
        const folderInfo = this.findFolderInfo(this.currentView.projectId);
        if (folderInfo) {
          mainSelect.value = `${folderInfo.section.id}:::${folderInfo.folder.id}`;
        } else {
          mainSelect.value = `${this.currentView.sectionId}:::${this.currentView.projectId}`;
        }
      } else if (typeof this.currentView === 'object' && this.currentView.sectionId) {
        if (prevVal && prevVal.startsWith(`${this.currentView.sectionId}:::`)) {
          mainSelect.value = prevVal;
        } else {
          const sec = this.data.sections.find(s => s.id === this.currentView.sectionId);
          if (sec && sec.projects && sec.projects.length > 0) {
            mainSelect.value = `${sec.id}:::${sec.projects[0].id}`;
          }
        }
      } else if (prevVal && mainSelect.querySelector(`option[value="${prevVal}"]`)) {
        mainSelect.value = prevVal;
      }
    }

    if (taskModalSelect) {
      const prevVal = explicitModalVal || taskModalSelect.value;
      const editModal = document.getElementById('modal-edit-task');
      const isModalOpen = editModal && editModal.style.display !== 'none';
      taskModalSelect.innerHTML = options || '<option value="default">Без проекта</option>';
      if ((isModalOpen || explicitModalVal) && prevVal) {
        let matched = false;
        for (let i = 0; i < taskModalSelect.options.length; i++) {
          const opt = taskModalSelect.options[i];
          if (opt.value === prevVal || (prevVal.includes(':::') && opt.value.endsWith(`:::${prevVal.split(':::')[1]}`))) {
            taskModalSelect.selectedIndex = i;
            opt.selected = true;
            taskModalSelect.value = opt.value;
            matched = true;
            break;
          }
        }
        if (!matched && prevVal.includes(':::')) {
          const fallbackOpt = document.createElement('option');
          fallbackOpt.value = prevVal;
          const folderInfo = this.findFolderInfo(prevVal.split(':::')[1]);
          fallbackOpt.textContent = `📁 ${folderInfo?.folder?.name || prevVal}`;
          fallbackOpt.selected = true;
          taskModalSelect.appendChild(fallbackOpt);
          taskModalSelect.selectedIndex = taskModalSelect.options.length - 1;
          taskModalSelect.value = prevVal;
        }
      }
    }

    const quickTaskSelect = document.getElementById('quick-task-project-select');
    if (quickTaskSelect) {
      const prevQuickVal = quickTaskSelect.value;
      quickTaskSelect.innerHTML = options || '<option value="default">Без проекта</option>';
      if (prevQuickVal && quickTaskSelect.querySelector(`option[value="${prevQuickVal}"]`)) {
        quickTaskSelect.value = prevQuickVal;
      }
    }

    if (modalSectionSelect) {
      let secOptions = '';
      this.data.sections.forEach(sec => {
        secOptions += `<option value="${sec.id}">${sec.icon || '📁'} ${sec.name}</option>`;
      });
      modalSectionSelect.innerHTML = secOptions;
    }

    if (archiveSectionFilter) {
      let archOptions = '<option value="all">📁 Все разделы и проекты</option>';
      this.data.sections.forEach(sec => {
        archOptions += `<option value="sec:${sec.id}">${sec.icon || '📁'} Все: ${sec.name}</option>`;
        
        const buildArchOptions = (folders, indent = '　└ ') => {
          folders.forEach(f => {
            archOptions += `<option value="proj:${sec.id}:${f.id}">${indent}${f.icon || '📂'} ${f.name}</option>`;
            if (f.children && f.children.length > 0) {
              buildArchOptions(f.children, indent + '　└ ');
            }
          });
        };

        if (sec.projects) buildArchOptions(sec.projects);
      });
      archiveSectionFilter.innerHTML = archOptions;

      const statsSectionFilter = document.getElementById('stats-section-filter');
      if (statsSectionFilter) {
        statsSectionFilter.innerHTML = archOptions;
      }

      const timelineSecFilter = document.getElementById('timeline-filter-section');
      if (timelineSecFilter) {
        let secOpts = '<option value="all">Все категории (разделы)</option>';
        this.data.sections.forEach(s => {
          secOpts += `<option value="${s.id}">${s.icon || '📁'} ${this.escapeHtml(s.name)}</option>`;
        });
        timelineSecFilter.innerHTML = secOpts;
        if (this.timelineFilterSection) timelineSecFilter.value = this.timelineFilterSection;
      }

      const timelineProjFilter = document.getElementById('timeline-filter-project');
      if (timelineProjFilter) {
        timelineProjFilter.innerHTML = options || '<option value="all">Все папки и проекты</option>';
        if (this.timelineFilterProject) timelineProjFilter.value = this.timelineFilterProject;
      }
    }

    const modalTaskSelect = document.getElementById('modal-time-log-task-select');
    if (modalTaskSelect) {
      let taskOpts = '<option value="">-- Без привязки к конкретной задаче --</option>';
      this.data.tasks.forEach(t => {
        taskOpts += `<option value="${t.id}">💼 ${this.escapeHtml(t.title)}</option>`;
      });
      this.data.completedTasks.forEach(t => {
        taskOpts += `<option value="${t.id}">🏆 (Архив) ${this.escapeHtml(t.title)}</option>`;
      });
      modalTaskSelect.innerHTML = taskOpts;
    }
  },

  populateParentProjectSelects(currentEditId = null) {
    const secSelect = document.getElementById('modal-project-section-select');
    const parentSelect = document.getElementById('modal-project-parent-select');
    if (!secSelect || !parentSelect) return;

    const secId = secSelect.value;
    const section = this.data.sections.find(s => s.id === secId);
    if (!section) return;

    let options = '<option value="">📁 Корень раздела (Основная папка)</option>';

    let excludeIds = [];
    if (currentEditId) {
      const info = this.findFolderInfo(currentEditId);
      if (info && info.folder) {
        excludeIds = this.getAllChildFolderIds(info.folder);
      }
    }

    const buildParentOptions = (folders, indent = '　└ ') => {
      folders.forEach(f => {
        if (!excludeIds.includes(f.id)) {
          options += `<option value="${f.id}">${indent}${f.icon || '📂'} ${f.name}</option>`;
          if (f.children && f.children.length > 0) {
            buildParentOptions(f.children, indent + '　└ ');
          }
        }
      });
    };

    if (section.projects) buildParentOptions(section.projects);
    parentSelect.innerHTML = options;
  },

  // =========================================================================
  // Переключение экранов (Views)
  // =========================================================================
  selectView(view) {
    this.currentView = view;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tag-chip').forEach(el => el.classList.remove('active'));

    const viewActive = document.getElementById('view-active-tasks');
    const viewPeriod = document.getElementById('view-period');
    const viewArchive = document.getElementById('view-archive');
    const viewStats = document.getElementById('view-stats');
    const viewReminders = document.getElementById('view-reminders');
    const viewHelp = document.getElementById('view-help');
    const viewTimeline = document.getElementById('view-timeline');

    if (view === 'help') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'none';
      if (viewStats) viewStats.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'flex';
      const navHelp = document.getElementById('nav-help');
      if (navHelp) navHelp.classList.add('active');
      this.renderSidebar();
      return;
    }

    if (view === 'reminders') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'none';
      if (viewStats) viewStats.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'flex';
      const navReminders = document.getElementById('nav-reminders-view');
      if (navReminders) navReminders.classList.add('active');
      this.renderRemindersView();
      this.renderSidebar();
      return;
    }

    if (view === 'stats') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'none';
      if (viewStats) viewStats.style.display = 'flex';
      const navStats = document.getElementById('nav-stats');
      if (navStats) navStats.classList.add('active');
      this.renderStatsView();
      this.renderSidebar();
      return;
    }

    if (view === 'archive') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'none';
      if (viewStats) viewStats.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'flex';
      const navArch = document.getElementById('nav-archive');
      if (navArch) navArch.classList.add('active');
      this.renderArchive();
      this.renderSidebar();
      return;
    }

    if (view === 'timeline') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'none';
      if (viewStats) viewStats.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'flex';
      const navTimeline = document.getElementById('nav-timeline-tasks');
      if (navTimeline) navTimeline.classList.add('active');
      this.renderTimelineView();
      this.renderSidebar();
      return;
    }

    if (view === 'week' || view === 'month') {
      if (viewActive) viewActive.style.display = 'none';
      if (viewArchive) viewArchive.style.display = 'none';
      if (viewStats) viewStats.style.display = 'none';
      if (viewReminders) viewReminders.style.display = 'none';
      if (viewHelp) viewHelp.style.display = 'none';
      if (viewTimeline) viewTimeline.style.display = 'none';
      if (viewPeriod) viewPeriod.style.display = 'flex';

      this.currentPeriodType = view;
      this.periodOffset = 0;

      const navEl = document.getElementById(`nav-${view}-tasks`);
      if (navEl) navEl.classList.add('active');

      this.renderPeriodView();
      this.renderSidebar();
      return;
    }

    if (viewActive) {
      viewActive.style.display = 'flex';
      if (view !== 'today') {
        viewActive.classList.remove('view-panel-wide');
      }
    }
    if (viewPeriod) viewPeriod.style.display = 'none';
    if (viewArchive) viewArchive.style.display = 'none';
    if (viewStats) viewStats.style.display = 'none';
    if (viewReminders) viewReminders.style.display = 'none';
    if (viewHelp) viewHelp.style.display = 'none';
    if (viewTimeline) viewTimeline.style.display = 'none';

    const mainSelect = document.getElementById('new-task-project-select');
    const todayModeToggle = document.getElementById('today-view-mode-toggle');

    if (view === 'all') {
      const navAll = document.getElementById('nav-all-tasks');
      if (navAll) navAll.classList.add('active');
      document.getElementById('current-view-title').textContent = 'Все активные задачи';
      document.getElementById('current-view-subtitle').textContent = 'Список текущих дел в работе';
      if (todayModeToggle) todayModeToggle.style.display = 'none';
      const timelineCol = document.getElementById('today-timeline-col');
      if (timelineCol) timelineCol.style.display = 'none';
    } else if (view === 'today') {
      const navToday = document.getElementById('nav-today-tasks');
      if (navToday) navToday.classList.add('active');
      document.getElementById('current-view-title').textContent = 'Задачи на сегодня ⭐';
      document.getElementById('current-view-subtitle').textContent = 'Дела со сроком выполнения или напоминанием на сегодня';
      if (todayModeToggle) todayModeToggle.style.display = 'flex';
      this.applyTodayTimelineMode();
    } else if (typeof view === 'object' && view.type === 'tag') {
      document.getElementById('current-view-title').textContent = `🏷️ Тег: #${view.tag}`;
      document.getElementById('current-view-subtitle').textContent = `Задачи с хештегом #${view.tag}`;
      if (todayModeToggle) todayModeToggle.style.display = 'none';
      const timelineCol = document.getElementById('today-timeline-col');
      if (timelineCol) timelineCol.style.display = 'none';
    } else if (typeof view === 'object' && view.sectionId && view.projectId) {
      if (todayModeToggle) todayModeToggle.style.display = 'none';
      const timelineCol = document.getElementById('today-timeline-col');
      if (timelineCol) timelineCol.style.display = 'none';
      const folderInfo = this.findFolderInfo(view.projectId);
      if (folderInfo) {
        const { folder, section } = folderInfo;
        document.getElementById('current-view-title').textContent = `${folder.icon || '📂'} ${folder.name}`;
        document.getElementById('current-view-subtitle').textContent = `Раздел: ${section.icon || '📁'} ${section.name}`;
        
        if (mainSelect) {
          const targetVal = `${section.id}:::${folder.id}`;
          if (!mainSelect.querySelector(`option[value="${targetVal}"]`)) {
            this.populateProjectSelects();
          }
          mainSelect.value = targetVal;
        }
      }
    } else if (typeof view === 'object' && view.sectionId && !view.projectId) {
      if (todayModeToggle) todayModeToggle.style.display = 'none';
      const timelineCol = document.getElementById('today-timeline-col');
      if (timelineCol) timelineCol.style.display = 'none';
      const section = this.data.sections.find(s => s.id === view.sectionId);
      if (section) {
        document.getElementById('current-view-title').textContent = `${section.icon || '📁'} Раздел: ${section.name}`;
        document.getElementById('current-view-subtitle').textContent = `Все задачи раздела «${section.name}»`;
        if (mainSelect && section.projects && section.projects.length > 0) {
          if (!mainSelect.value || !mainSelect.value.startsWith(`${section.id}:::`)) {
            mainSelect.value = `${section.id}:::${section.projects[0].id}`;
          }
        }
      }
    }

    this.renderSidebar();
    this.renderCurrentView();
  },

  // =========================================================================
  // РЕЖИМ ПЕРИОДА: Неделя и Месяц
  // =========================================================================
  getWeekDays(offset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = Mon, 6 = Sun
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + (offset * 7), 12, 0, 0);

    const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const shortNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const todayStr = this.getLocalDateStr();

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      const dateStr = this.getLocalDateStr(d);
      const displayDate = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      days.push({
        dateStr: dateStr,
        dayName: dayNames[i],
        shortDay: shortNames[i],
        displayDate: displayDate,
        isToday: dateStr === todayStr,
        dateObj: d
      });
    }
    return days;
  },

  renderPeriodView() {
    if (this.currentPeriodType === 'week') {
      this.renderWeekView();
    } else {
      this.renderMonthView();
    }
  },

  prevPeriod() {
    this.periodOffset--;
    this.renderPeriodView();
  },

  nextPeriod() {
    this.periodOffset++;
    this.renderPeriodView();
  },

  todayPeriod() {
    this.periodOffset = 0;
    this.renderPeriodView();
  },

  onSearchPeriodTasks(query) {
    this.periodSearchQuery = query;
    this.renderPeriodView();
  },

  renderWeekView() {
    const days = this.getWeekDays(this.periodOffset);
    const firstDay = days[0];
    const lastDay = days[6];

    const titleEl = document.getElementById('period-view-title');
    const subTitleEl = document.getElementById('period-view-subtitle');
    const contentEl = document.getElementById('period-view-content');

    if (titleEl) {
      titleEl.textContent = `📅 Неделя: ${firstDay.displayDate} — ${lastDay.displayDate} ${lastDay.dateObj.getFullYear()}`;
    }
    if (subTitleEl) {
      subTitleEl.textContent = this.periodOffset === 0 ? 'Текущая неделя (расписание по дням)' : `Смещение: ${this.periodOffset > 0 ? '+' : ''}${this.periodOffset} нед.`;
    }

    let activeTasks = this.data.tasks.filter(t => !t.completed);
    if (this.periodSearchQuery.trim()) {
      const q = this.periodSearchQuery.toLowerCase();
      activeTasks = activeTasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    let html = `<div class="week-view-container">`;

    days.forEach(day => {
      const dayTasks = activeTasks.filter(t => {
        const taskDate = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
        return taskDate === day.dateStr;
      });

      const isTodayClass = day.isToday ? 'is-today' : '';
      const todayPill = day.isToday ? `<span class="badge-today-pill">Сегодня</span>` : '';

      html += `
        <div class="week-day-card ${isTodayClass}">
          <div class="week-day-header">
            <div class="week-day-title-wrap">
              <span class="week-day-name">${day.dayName}</span>
              <span class="week-day-date">(${day.displayDate})</span>
              ${todayPill}
            </div>
            <span class="badge" title="Задач на день">${dayTasks.length}</span>
          </div>

          <div class="week-day-tasks">
      `;

      if (dayTasks.length === 0) {
        html += `<div class="week-day-empty">Нет запланированных задач на этот день</div>`;
      } else {
        dayTasks.forEach(task => {
          html += this.renderTaskCardHtml(task);
        });
      }

      html += `
          </div>

          <button type="button" class="btn-add-day-task" onclick="App.quickAddDayTask('${day.dateStr}')">
            ➕ Добавить задачу на ${day.shortDay}, ${day.displayDate}
          </button>
        </div>
      `;
    });

    html += `</div>`;

    // Секция нераспределенных задач (без даты)
    const undatedTasks = activeTasks.filter(t => !t.dueDate && !t.reminderTime);
    if (undatedTasks.length > 0) {
      const isUndatedCollapsed = this.isUndatedSectionCollapsed ? 'collapsed' : '';
      const todayStr = this.getLocalDateStr();
      html += `
        <div class="undated-tasks-panel ${isUndatedCollapsed}">
          <div class="undated-tasks-header" onclick="App.toggleUndatedSectionCollapse()">
            <div class="undated-title-wrap">
              <span class="undated-toggle-icon">${this.isUndatedSectionCollapsed ? '▸' : '▾'}</span>
              <span class="undated-title">📌 Нераспределенные задачи (без даты)</span>
              <span class="badge">${undatedTasks.length}</span>
            </div>
            <span class="undated-hint">Нажмите для выбора даты</span>
          </div>

          ${!this.isUndatedSectionCollapsed ? `
            <div class="undated-tasks-list">
              ${undatedTasks.map(t => {
                const folderInfo = this.findFolderInfo(t.projectId);
                const projName = folderInfo ? folderInfo.folder.name : 'Общие';
                return `
                  <div class="undated-task-row">
                    <div class="undated-task-info">
                      <span class="undated-task-title">${this.escapeHtml(t.title)}</span>
                      <span class="tag-project">${this.escapeHtml(projName)}</span>
                    </div>
                    <div class="undated-quick-actions">
                      <button type="button" class="btn-sm btn-subtle" onclick="App.setTaskDueDateQuick('${t.id}', '${todayStr}')" title="Назначить на сегодня">
                        Сегодня
                      </button>
                      <button type="button" class="btn-sm btn-subtle" onclick="App.setTaskDueDateQuick('${t.id}', '${this.getLocalDatePlusDays(1)}')" title="Назначить на завтра">
                        Завтра
                      </button>
                      <button type="button" class="btn-sm btn-primary" onclick="App.openEditTaskModal('${t.id}')" title="Выбрать любую дату">
                        📅 Выбрать дату
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    if (contentEl) contentEl.innerHTML = html;
  },

  setMonthSubMode(subMode) {
    this.monthSubMode = subMode;
    this.periodOffset = 0;
    this.renderMonthView();
  },

  renderMonthView() {
    const subMode = this.monthSubMode || 'next30';
    const titleEl = document.getElementById('period-view-title');
    const subTitleEl = document.getElementById('period-view-subtitle');
    const contentEl = document.getElementById('period-view-content');

    let activeTasks = this.data.tasks.filter(t => !t.completed);
    if (this.periodSearchQuery.trim()) {
      const q = this.periodSearchQuery.toLowerCase();
      activeTasks = activeTasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    const todayStr = this.getLocalDateStr();
    let monthTasks = [];
    let periodTitleText = '';
    let periodSubtitleText = '';
    let nextMonthHintHtml = '';

    if (subMode === 'next30') {
      const dateEnd30 = this.getLocalDatePlusDays(30);
      const dEnd = this.parseLocalDate(dateEnd30);
      const endFormatted = dEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

      periodTitleText = `🗓️ Задачи на 30 дней вперед`;
      periodSubtitleText = `Период: с сегодня по ${endFormatted}`;

      monthTasks = activeTasks.filter(t => {
        const taskDate = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
        return taskDate && taskDate >= todayStr && taskDate <= dateEnd30;
      });
    } else {
      // Календарный месяц
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + this.periodOffset, 1, 12, 0, 0);
      const monthName = targetDate.toLocaleDateString('ru-RU', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const year = targetDate.getFullYear();
      const monthPrefix = this.getLocalMonthStr(targetDate);

      periodTitleText = `🗓️ Месяц: ${capitalizedMonth} ${year}`;
      periodSubtitleText = this.periodOffset === 0 ? 'Календарный месяц' : `Смещение: ${this.periodOffset > 0 ? '+' : ''}${this.periodOffset} мес.`;

      monthTasks = activeTasks.filter(t => {
        const taskDate = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
        return taskDate && taskDate.startsWith(monthPrefix);
      });

      // Проверяем, есть ли задачи в следующем месяце
      const nextMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1, 12, 0, 0);
      const nextMonthPrefix = this.getLocalMonthStr(nextMonthDate);
      const nextMonthName = nextMonthDate.toLocaleDateString('ru-RU', { month: 'long' });
      const nextMonthCapitalized = nextMonthName.charAt(0).toUpperCase() + nextMonthName.slice(1);
      const nextMonthTasksCount = activeTasks.filter(t => {
        const d = t.dueDate || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
        return d && d.startsWith(nextMonthPrefix);
      }).length;

      if (nextMonthTasksCount > 0) {
        nextMonthHintHtml = `
          <div class="period-next-month-alert" onclick="App.nextPeriod()">
            <span>👉 В следующем месяце (<b>${nextMonthCapitalized} ${nextMonthDate.getFullYear()}</b>) есть запланированные задачи: <b>${nextMonthTasksCount}</b>. Нажмите для перехода →</span>
          </div>
        `;
      }
    }

    if (titleEl) titleEl.textContent = periodTitleText;
    if (subTitleEl) subTitleEl.textContent = periodSubtitleText;

    // Кнопки переключения подрежима Месяца
    let modeTabsHtml = `
      <div class="period-submode-bar">
        <div class="filter-buttons-row">
          <button type="button" class="btn-filter ${subMode === 'next30' ? 'active' : ''}" onclick="App.setMonthSubMode('next30')">
            📅 Ближайшие 30 дней
          </button>
          <button type="button" class="btn-filter ${subMode === 'calendar' ? 'active' : ''}" onclick="App.setMonthSubMode('calendar')">
            🗓️ Календарный месяц
          </button>
        </div>
      </div>
      ${nextMonthHintHtml}
    `;

    // Задачи без даты
    const undatedTasks = activeTasks.filter(t => !t.dueDate && !t.reminderTime);

    let html = modeTabsHtml + `<div class="month-view-container">`;

    if (monthTasks.length === 0) {
      html += `
        <div class="empty-state" style="margin-bottom: 24px;">
          <div class="empty-icon">📅</div>
          <div class="empty-title">В выбранном периоде нет задач с датой</div>
          <div class="empty-desc">Назначьте дату выполнения для задач из списка ниже или создайте новую задачу.</div>
        </div>
      `;
    } else {
      const dateGroups = new Map();
      monthTasks.forEach(task => {
        const dateKey = task.dueDate || (task.reminderTime ? this.getLocalDateStr(new Date(task.reminderTime)) : '');
        if (dateKey) {
          if (!dateGroups.has(dateKey)) {
            dateGroups.set(dateKey, []);
          }
          dateGroups.get(dateKey).push(task);
        }
      });

      const sortedDates = Array.from(dateGroups.keys()).sort();

      sortedDates.forEach(dateKey => {
        const tasks = dateGroups.get(dateKey);
        const d = this.parseLocalDate(dateKey);
        const dayOfWeekName = d.toLocaleDateString('ru-RU', { weekday: 'long' });
        const capitalizedDayOfWeek = dayOfWeekName.charAt(0).toUpperCase() + dayOfWeekName.slice(1);
        const dayFormatted = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        const isToday = dateKey === todayStr;
        const isTodayClass = isToday ? 'is-today' : '';

        html += `
          <div class="month-date-group ${isTodayClass}">
            <div class="week-day-header">
              <div class="week-day-title-wrap">
                <span class="week-day-name">${capitalizedDayOfWeek}, ${dayFormatted}</span>
                ${isToday ? `<span class="badge-today-pill">Сегодня</span>` : ''}
              </div>
              <span class="badge" title="Задач на дату">${tasks.length}</span>
            </div>
            <div class="week-day-tasks">
        `;

        tasks.forEach(task => {
          html += this.renderTaskCardHtml(task);
        });

        html += `
            </div>
            <button type="button" class="btn-add-day-task" onclick="App.quickAddDayTask('${dateKey}')">
              ➕ Добавить задачу на ${dayFormatted}
            </button>
          </div>
        `;
      });
    }

    html += `</div>`;

    // Секция нераспределенных задач (без даты)
    if (undatedTasks.length > 0) {
      const isUndatedCollapsed = this.isUndatedSectionCollapsed ? 'collapsed' : '';
      html += `
        <div class="undated-tasks-panel ${isUndatedCollapsed}">
          <div class="undated-tasks-header" onclick="App.toggleUndatedSectionCollapse()">
            <div class="undated-title-wrap">
              <span class="undated-toggle-icon">${this.isUndatedSectionCollapsed ? '▸' : '▾'}</span>
              <span class="undated-title">📌 Нераспределенные задачи (без даты)</span>
              <span class="badge">${undatedTasks.length}</span>
            </div>
            <span class="undated-hint">Нажмите для выбора даты</span>
          </div>

          ${!this.isUndatedSectionCollapsed ? `
            <div class="undated-tasks-list">
              ${undatedTasks.map(t => {
                const folderInfo = this.findFolderInfo(t.projectId);
                const projName = folderInfo ? folderInfo.folder.name : 'Общие';
                return `
                  <div class="undated-task-row">
                    <div class="undated-task-info">
                      <span class="undated-task-title">${this.escapeHtml(t.title)}</span>
                      <span class="tag-project">${this.escapeHtml(projName)}</span>
                    </div>
                    <div class="undated-quick-actions">
                      <button type="button" class="btn-sm btn-subtle" onclick="App.setTaskDueDateQuick('${t.id}', '${todayStr}')" title="Назначить на сегодня">
                        Сегодня
                      </button>
                      <button type="button" class="btn-sm btn-subtle" onclick="App.setTaskDueDateQuick('${t.id}', '${this.getLocalDatePlusDays(1)}')" title="Назначить на завтра">
                        Завтра
                      </button>
                      <button type="button" class="btn-sm btn-primary" onclick="App.openEditTaskModal('${t.id}')" title="Выбрать любую дату">
                        📅 Выбрать дату
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    if (contentEl) contentEl.innerHTML = html;
  },

  setTaskDueDateQuick(taskId, dateStr) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.dueDate = dateStr;
    task.updatedAt = new Date().toISOString();
    this.saveData();
    this.renderPeriodView();
    this.renderSidebar();
    this.updateBadges();
  },

  toggleUndatedSectionCollapse() {
    this.isUndatedSectionCollapsed = !this.isUndatedSectionCollapsed;
    this.renderPeriodView();
  },

  quickAddDayTask(dateStr) {
    this.openQuickCaptureModal({ dueDate: dateStr });
  },

  // =========================================================================
  // РЕЖИМ ТАЙМ-БЛОКИНГА И РАСПИСАНИЯ (v1.0.67)
  // =========================================================================

  setTodayTimelineMode(mode) {
    this.todayTimelineMode = mode;
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.todayTimelineMode = mode;
    this.saveData();
    this.applyTodayTimelineMode();
  },

  applyTodayTimelineMode() {
    const isSplit = this.todayTimelineMode === 'split' && this.currentView === 'today';
    const viewActive = document.getElementById('view-active-tasks');
    const timelineCol = document.getElementById('today-timeline-col');
    const resizer = document.getElementById('resizer-today-split');
    const btnList = document.getElementById('btn-today-mode-list');
    const btnSplit = document.getElementById('btn-today-mode-split');

    if (btnList) btnList.classList.toggle('active', !isSplit);
    if (btnSplit) btnSplit.classList.toggle('active', isSplit);

    if (viewActive) {
      viewActive.classList.toggle('view-panel-wide', isSplit);
    }

    if (resizer) {
      resizer.style.display = isSplit ? 'flex' : 'none';
    }

    if (timelineCol) {
      if (this.data.settings?.todayTimelineWidth) {
        timelineCol.style.width = `${this.data.settings.todayTimelineWidth}px`;
      }
      timelineCol.style.display = isSplit ? 'block' : 'none';
      if (isSplit) {
        this.renderTodayTimeline();
        setTimeout(() => this.scrollTimelineToNow('today'), 120);
      }
    }
  },

  calculateTimelineRange(dateStrs, tasks, scope = 'today') {
    if (!this.lastTimelineRange) {
      this.lastTimelineRange = { today: { minHour: 7, maxHour: 22 }, main: { minHour: 7, maxHour: 22 } };
    }

    if (this.timeline24h && this.timeline24h[scope]) {
      const res = { minHour: 0, maxHour: 24 };
      this.lastTimelineRange[scope] = res;
      return res;
    }

    // Комфортный стабильный базовый диапазон активного дня (07:00 — 22:00)
    let minHour = 7;
    let maxHour = 22;

    const now = new Date();
    const nowHour = now.getHours();
    const todayStr = this.getLocalDateStr();
    const isTodayIncluded = Array.isArray(dateStrs) ? dateStrs.includes(todayStr) : dateStrs === todayStr;

    // Если в расписании отображается сегодняшний день, учитываем текущий час
    if (isTodayIncluded) {
      if (nowHour < minHour) minHour = Math.max(0, nowHour - 1);
      if (nowHour + 1 > maxHour) maxHour = Math.min(24, nowHour + 2);
    }

    const dates = Array.isArray(dateStrs) ? dateStrs : [dateStrs];

    // Расширяем диапазон при наличии запланированных задач
    tasks.forEach(t => {
      if (t.timeBlock && dates.includes(t.timeBlock.date)) {
        const [sh] = (t.timeBlock.startTime || '09:00').split(':').map(Number);
        const [eh, em] = (t.timeBlock.endTime || '10:00').split(':').map(Number);
        if (!isNaN(sh) && sh < minHour) minHour = Math.max(0, sh);
        if (!isNaN(eh)) {
          const taskEndH = (em > 0 ? eh + 1 : eh);
          if (taskEndH > maxHour) maxHour = Math.min(24, taskEndH);
        }
      } else if (t.dueDate && dates.includes(t.dueDate) && t.reminderTime) {
        const d = new Date(t.reminderTime);
        if (!isNaN(d.getTime())) {
          const rh = d.getHours();
          if (rh < minHour) minHour = Math.max(0, rh);
          if (rh + 1 > maxHour) maxHour = Math.min(24, rh + 1);
        }
      }
    });

    // Применяем ручные расширения пользователя (▲ Раньше / ▼ Позже)
    const exp = this.timelineExpandedRanges ? this.timelineExpandedRanges[scope] : null;
    if (exp) {
      if (exp.min !== null && exp.min < minHour) minHour = Math.max(0, exp.min);
      if (exp.max !== null && exp.max > maxHour) maxHour = Math.min(24, exp.max);
    }

    minHour = Math.max(0, Math.min(23, minHour));
    maxHour = Math.max(minHour + 1, Math.min(24, maxHour));

    const res = { minHour, maxHour };
    this.lastTimelineRange[scope] = res;
    return res;
  },

  expandTimelineRangeEarly(scope = 'today') {
    if (!this.timelineExpandedRanges) {
      this.timelineExpandedRanges = { today: { min: null, max: null }, main: { min: null, max: null } };
    }
    if (!this.timelineExpandedRanges[scope]) {
      this.timelineExpandedRanges[scope] = { min: null, max: null };
    }
    const exp = this.timelineExpandedRanges[scope];
    const currentMin = exp.min !== null ? exp.min : (this.lastTimelineRange?.[scope]?.minHour ?? 7);
    const newMin = Math.max(0, currentMin - 2);
    if (newMin === exp.min && exp.min !== null) return; // уже 00:00
    const addedHours = currentMin - newMin;
    exp.min = newMin;

    const scrollEl = document.getElementById(scope === 'today' ? 'today-timeline-scroll' : 'main-timeline-scroll');
    const prevScrollTop = scrollEl ? scrollEl.scrollTop : 0;

    if (scope === 'today') this.renderTodayTimeline();
    else this.renderTimelineView();

    // Компенсация скролла, чтобы сетка не дергалась и контент не прыгал визуально
    if (scrollEl && addedHours > 0) {
      scrollEl.scrollTop = prevScrollTop + (addedHours * 60);
    }
  },

  expandTimelineRangeLate(scope = 'today') {
    if (!this.timelineExpandedRanges) {
      this.timelineExpandedRanges = { today: { min: null, max: null }, main: { min: null, max: null } };
    }
    if (!this.timelineExpandedRanges[scope]) {
      this.timelineExpandedRanges[scope] = { min: null, max: null };
    }
    const exp = this.timelineExpandedRanges[scope];
    const currentMax = exp.max !== null ? exp.max : (this.lastTimelineRange?.[scope]?.maxHour ?? 22);
    const newMax = Math.min(24, currentMax + 2);
    if (newMax === exp.max && exp.max !== null) return; // уже 24:00
    exp.max = newMax;

    if (scope === 'today') this.renderTodayTimeline();
    else this.renderTimelineView();
  },

  toggleTimeline24h(scope = 'today') {
    if (!this.timeline24h) this.timeline24h = { today: false, main: false };
    this.timeline24h[scope] = !this.timeline24h[scope];
    const btn = document.getElementById(scope === 'today' ? 'btn-today-timeline-24h' : 'btn-timeline-main-24h');
    if (btn) btn.classList.toggle('active', this.timeline24h[scope]);
    if (scope === 'today') this.renderTodayTimeline();
    else this.renderTimelineView();
  },

  scrollTimelineToNow(scope = 'today') {
    const scrollEl = document.getElementById(scope === 'today' ? 'today-timeline-scroll' : 'main-timeline-scroll');
    if (!scrollEl) return;
    const nowLine = scrollEl.querySelector('.timeline-now-line');
    if (nowLine) {
      const lineRect = nowLine.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      const targetScrollTop = (lineRect.top - scrollRect.top + scrollEl.scrollTop) - (scrollEl.clientHeight / 2);
      scrollEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    }
  },

  updateTimelineNowLine() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    document.querySelectorAll('.timeline-now-line').forEach(line => {
      const minHourAttr = line.getAttribute('data-min-hour');
      const minHour = minHourAttr !== null ? parseInt(minHourAttr, 10) : (this.timelineMinHour || 0);
      const maxHourAttr = line.getAttribute('data-max-hour');
      const maxHour = maxHourAttr !== null ? parseInt(maxHourAttr, 10) : 24;
      const offsetTop = parseInt(line.getAttribute('data-offset-top'), 10) || 0;

      if (hours >= minHour && hours < maxHour) {
        line.style.display = 'block';
        const topPx = offsetTop + (totalMinutes - minHour * 60);
        line.style.top = `${topPx}px`;
        const badge = line.querySelector('.timeline-now-badge');
        if (badge) badge.textContent = `${timeStr} Сейчас`;
        const miniBadge = line.querySelector('.timeline-now-mini-badge');
        if (miniBadge) miniBadge.textContent = timeStr;
      } else {
        line.style.display = 'none';
      }
    });
  },

  renderTodayTimeline() {
    const gridContainer = document.getElementById('today-timeline-grid');
    if (!gridContainer) return;

    const todayStr = this.getLocalDateStr();
    const dateTitle = document.getElementById('today-timeline-date-title');
    if (dateTitle) {
      const d = new Date();
      dateTitle.textContent = `Сегодня, ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
    }

    const todayTasks = this.data.tasks.filter(t => {
      const d = t.dueDate || (t.timeBlock ? t.timeBlock.date : null);
      return d === todayStr;
    });

    const { minHour, maxHour } = this.calculateTimelineRange(todayStr, todayTasks, 'today');

    let html = '';

    // Генерируем часовые строки
    for (let h = minHour; h < maxHour; h++) {
      const hourLabel = `${String(h).padStart(2, '0')}:00`;
      html += `
        <div class="timeline-hour-row" data-hour="${h}">
          <div class="timeline-hour-label">${hourLabel}</div>
          <div class="timeline-hour-slot" 
               data-date="${todayStr}" 
               data-hour="${h}"
               ondragover="App.onTimelineSlotDragOver(event)" 
               ondragleave="App.onTimelineSlotDragLeave(event)" 
               ondrop="App.onTimelineSlotDrop(event, '${todayStr}', ${h})"
               onclick="App.onTimelineSlotClick('${todayStr}', ${h})"
               title="Кликните или перетащите задачу, чтобы запланировать на ${hourLabel}">
          </div>
        </div>
      `;
    }

    // Красная линия текущего времени
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowTotalMins = nowHours * 60 + nowMinutes;
    const nowTimeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}`;
    const isNowVisible = nowHours >= minHour && nowHours < maxHour;
    const nowTopPx = nowTotalMins - minHour * 60;

    html += `
      <div class="timeline-now-line" 
           data-min-hour="${minHour}" 
           data-max-hour="${maxHour}"
           data-offset-top="0"
           style="display: ${isNowVisible ? 'block' : 'none'}; top: ${nowTopPx}px;">
        <div class="timeline-now-dot"></div>
        <span class="timeline-now-badge">${nowTimeStr} Сейчас</span>
      </div>
    `;

    // Рендерим блоки задач
    const scheduledTasks = todayTasks.filter(t => t.timeBlock && t.timeBlock.date === todayStr);

    scheduledTasks.forEach(task => {
      const tb = task.timeBlock;
      const [startH, startM] = (tb.startTime || '09:00').split(':').map(Number);
      const startMins = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 0 : startM);
      const durationMins = tb.durationMinutes || 60;

      const topPx = startMins - minHour * 60;
      const heightPx = Math.max(26, durationMins);

      const isRunning = TimerEngine.isRunning(task.id);
      const playIcon = isRunning ? '⏸' : '▶';
      const playTitle = isRunning ? 'Приостановить таймер' : 'Запустить таймер';
      const isCompleted = !!task.completed;

      const borderStyle = task.color ? `border-left-color: ${task.color};` : '';
      const bgStyle = task.color ? `background: linear-gradient(to right, ${task.color}15, var(--bg-card) 45%);` : '';

      const folderInfo = this.findFolderInfo(task.projectId);
      const projIcon = folderInfo?.folder?.icon || '💼';

      html += `
        <div class="timeline-block ${isCompleted ? 'completed' : ''}" 
             id="timeline-block-${task.id}"
             style="top: ${topPx}px; height: ${heightPx}px; ${borderStyle} ${bgStyle}"
             draggable="true"
             ondragstart="App.onDragStart(event, '${task.id}')"
             ondragend="App.onDragEnd(event)"
             onclick="App.openEditTaskModal('${task.id}')"
             title="${this.escapeHtml(task.title)} (${tb.startTime} — ${tb.endTime})">
          <div class="timeline-block-header">
            <span class="timeline-block-title">${projIcon} ${this.escapeHtml(task.title)}</span>
            <div class="timeline-block-actions" onclick="event.stopPropagation()">
              <button class="timeline-block-btn-play" onclick="App.toggleTaskTimer('${task.id}')" title="${playTitle}">${playIcon}</button>
              <button class="timeline-block-btn-del" onclick="App.removeTaskTimeBlock('${task.id}')" title="Убрать из расписания">✕</button>
            </div>
          </div>
          <div class="timeline-block-time" onclick="event.stopPropagation(); App.openTimelineIntervalPopover('${task.id}', event.clientX, event.clientY)" title="Нажмите для точной настройки интервала времени">⏱️ ${tb.startTime} — ${tb.endTime} (${durationMins}м)</div>
          <div class="timeline-block-resize-handle" onmousedown="App.onTimelineResizeStart(event, '${task.id}')" title="Потяните для изменения длительности"></div>
        </div>
      `;
    });

    gridContainer.innerHTML = html;
  },

  // =========================================================================
  // ПОЛНОЭКРАННОЕ РАСПИСАНИЕ (1 ДЕНЬ / 7 ДНЕЙ НЕДЕЛИ)
  // =========================================================================

  setTimelineScale(scale) {
    this.timelineScale = scale;
    const btnDay = document.getElementById('btn-timeline-scale-day');
    const btnWeek = document.getElementById('btn-timeline-scale-week');
    if (btnDay) btnDay.classList.toggle('active', scale === 'day');
    if (btnWeek) btnWeek.classList.toggle('active', scale === 'week');
    this.renderTimelineView();
  },

  navigateTimelinePeriod(dir) {
    this.timelineOffset += dir;
    this.renderTimelineView();
  },

  resetTimelinePeriodToToday() {
    this.timelineOffset = 0;
    this.renderTimelineView();
  },

  onTimelineFilterSectionChange(secId) {
    this.timelineFilterSection = secId;
    this.renderTimelineView();
  },

  onTimelineFilterProjectChange(projId) {
    this.timelineFilterProject = projId;
    this.renderTimelineView();
  },

  onTimelineShowCompletedChange(checked) {
    this.timelineShowCompleted = checked;
    this.renderTimelineView();
  },

  renderTimelineView() {
    const container = document.getElementById('main-timeline-schedule');
    const backlogContainer = document.getElementById('timeline-backlog-list');
    const backlogBadge = document.getElementById('timeline-backlog-badge');
    const periodLabel = document.getElementById('timeline-period-label');
    if (!container) return;

    this.populateProjectSelects();

    // 1. Определение активных дат
    const now = new Date();
    let dates = [];
    if (this.timelineScale === 'day') {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + this.timelineOffset, 12, 0, 0);
      const dateStr = this.getLocalDateStr(targetDate);
      const isToday = dateStr === this.getLocalDateStr();
      dates = [{
        dateStr: dateStr,
        dayName: targetDate.toLocaleDateString('ru-RU', { weekday: 'long' }),
        shortDay: targetDate.toLocaleDateString('ru-RU', { weekday: 'short' }),
        displayDate: targetDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        isToday: isToday,
        dateObj: targetDate
      }];
      if (periodLabel) {
        periodLabel.textContent = `${dates[0].displayDate} (${dates[0].dayName})`;
      }
    } else {
      dates = this.getWeekDays(this.timelineOffset);
      if (periodLabel && dates.length === 7) {
        const first = dates[0].dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        const last = dates[6].dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        periodLabel.textContent = `${first} — ${last}`;
      }
    }

    const dateStrs = dates.map(d => d.dateStr);

    // 2. Задачи для расписания с учетом фильтров
    let candidateTasks = this.data.tasks;
    if (!this.timelineShowCompleted) {
      candidateTasks = candidateTasks.filter(t => !t.completed);
    }

    if (this.timelineFilterSection && this.timelineFilterSection !== 'all') {
      candidateTasks = candidateTasks.filter(t => t.sectionId === this.timelineFilterSection);
    }

    if (this.timelineFilterProject && this.timelineFilterProject !== 'all') {
      const fInfo = this.findFolderInfo(this.timelineFilterProject);
      if (fInfo) {
        const allFolderIds = this.getAllChildFolderIds(fInfo.folder);
        candidateTasks = candidateTasks.filter(t => allFolderIds.includes(t.projectId));
      } else {
        candidateTasks = candidateTasks.filter(t => t.projectId === this.timelineFilterProject);
      }
    }

    // 3. Рендер беклога (нераспределенные задачи)
    const scheduledTaskIds = new Set();
    candidateTasks.forEach(t => {
      if (t.timeBlock && dateStrs.includes(t.timeBlock.date)) {
        scheduledTaskIds.add(t.id);
      }
    });

    const backlogTasks = candidateTasks.filter(t => !scheduledTaskIds.has(t.id) && !t.completed);
    if (backlogBadge) backlogBadge.textContent = backlogTasks.length;

    if (backlogContainer) {
      if (backlogTasks.length === 0) {
        backlogContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px 10px;">Все задачи распределены по времени! ✨</div>';
      } else {
        let bHtml = '';
        backlogTasks.forEach(t => {
          const folderInfo = this.findFolderInfo(t.projectId);
          const projName = folderInfo ? folderInfo.folder.name : 'Общие';
          const projIcon = folderInfo ? (folderInfo.folder.icon || '📂') : '📂';
          const colorStyle = t.color ? `border-left: 4px solid ${t.color};` : '';
          const dateBadge = t.dueDate ? `<span>📅 ${t.dueDate}</span>` : '';

          bHtml += `
            <div class="timeline-backlog-card" 
                 id="backlog-task-${t.id}"
                 style="${colorStyle}"
                 draggable="true"
                 ondragstart="App.onDragStart(event, '${t.id}')"
                 ondragend="App.onDragEnd(event)"
                 onclick="App.openEditTaskModal('${t.id}')"
                 title="Перетащите эту задачу на любой день или час расписания">
              <div class="timeline-backlog-card-title">${this.escapeHtml(t.title)}</div>
              <div class="timeline-backlog-card-meta">
                <span>${projIcon} ${this.escapeHtml(projName)}</span>
                ${dateBadge}
              </div>
            </div>
          `;
        });
        backlogContainer.innerHTML = bHtml;
      }
    }

    const backlogPanel = document.getElementById('timeline-backlog-panel');
    if (backlogPanel && this.data.settings?.timelineBacklogWidth) {
      backlogPanel.style.width = `${this.data.settings.timelineBacklogWidth}px`;
    }

    // 4. Вычисление диапазона шкалы (Auto-Fit)
    const { minHour, maxHour } = this.calculateTimelineRange(dateStrs, candidateTasks, 'main');

    // 5. Рендеринг сетки
    if (this.timelineScale === 'day') {
      // 1 День (подробно)
      const day = dates[0];
      let gridHtml = `
        <div class="timeline-grid-container" style="min-width: 100%;">
      `;

      for (let h = minHour; h < maxHour; h++) {
        const hourLabel = `${String(h).padStart(2, '0')}:00`;
        gridHtml += `
          <div class="timeline-hour-row" data-hour="${h}">
            <div class="timeline-hour-label">${hourLabel}</div>
            <div class="timeline-hour-slot" 
                 data-date="${day.dateStr}" 
                 data-hour="${h}"
                 ondragover="App.onTimelineSlotDragOver(event)" 
                 ondragleave="App.onTimelineSlotDragLeave(event)" 
                 ondrop="App.onTimelineSlotDrop(event, '${day.dateStr}', ${h})"
                 onclick="App.onTimelineSlotClick('${day.dateStr}', ${h})"
                 title="Запланировать задачу на ${day.dateStr} в ${hourLabel}">
            </div>
          </div>
        `;
      }

      // Линия Сейчас для сегодняшнего дня
      if (day.isToday) {
        const now = new Date();
        const nowHours = now.getHours();
        const nowMins = now.getMinutes();
        const isVisible = nowHours >= minHour && nowHours < maxHour;
        const topPx = nowHours * 60 + nowMins - minHour * 60;
        const timeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMins).padStart(2, '0')}`;
        gridHtml += `
          <div class="timeline-now-line" 
               data-min-hour="${minHour}" 
               data-max-hour="${maxHour}"
               data-offset-top="0"
               style="display: ${isVisible ? 'block' : 'none'}; top: ${topPx}px;">
            <div class="timeline-now-dot"></div>
            <span class="timeline-now-badge">${timeStr} Сейчас</span>
          </div>
        `;
      }

      // Блоки задач дня
      const dayTasks = candidateTasks.filter(t => t.timeBlock && t.timeBlock.date === day.dateStr);
      dayTasks.forEach(task => {
        const tb = task.timeBlock;
        const [startH, startM] = (tb.startTime || '09:00').split(':').map(Number);
        const startMins = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 0 : startM);
        const durationMins = tb.durationMinutes || 60;
        const topPx = startMins - minHour * 60;
        const heightPx = Math.max(26, durationMins);
        const isRunning = TimerEngine.isRunning(task.id);
        const playIcon = isRunning ? '⏸' : '▶';
        const borderStyle = task.color ? `border-left-color: ${task.color};` : '';
        const bgStyle = task.color ? `background: linear-gradient(to right, ${task.color}15, var(--bg-card) 45%);` : '';
        const folderInfo = this.findFolderInfo(task.projectId);
        const projIcon = folderInfo?.folder?.icon || '💼';

        gridHtml += `
          <div class="timeline-block ${task.completed ? 'completed' : ''}" 
               id="main-timeline-block-${task.id}"
               style="top: ${topPx}px; height: ${heightPx}px; ${borderStyle} ${bgStyle}"
               draggable="true"
               ondragstart="App.onDragStart(event, '${task.id}')"
               ondragend="App.onDragEnd(event)"
               onclick="App.openEditTaskModal('${task.id}')"
               title="${this.escapeHtml(task.title)} (${tb.startTime} — ${tb.endTime})">
            <div class="timeline-block-header">
              <span class="timeline-block-title">${projIcon} ${this.escapeHtml(task.title)}</span>
              <div class="timeline-block-actions" onclick="event.stopPropagation()">
                <button class="timeline-block-btn-play" onclick="App.toggleTaskTimer('${task.id}')" title="Таймер">${playIcon}</button>
                <button class="timeline-block-btn-del" onclick="App.removeTaskTimeBlock('${task.id}')" title="Убрать из расписания">✕</button>
              </div>
            </div>
            <div class="timeline-block-time" onclick="event.stopPropagation(); App.openTimelineIntervalPopover('${task.id}', event.clientX, event.clientY)" title="Нажмите для точной настройки интервала времени">⏱️ ${tb.startTime} — ${tb.endTime} (${durationMins}м)</div>
            <div class="timeline-block-resize-handle" onmousedown="App.onTimelineResizeStart(event, '${task.id}')" title="Потяните для изменения длительности"></div>
          </div>
        `;
      });

      gridHtml += '</div>';
      container.innerHTML = gridHtml;

    } else {
      // 7 Дней (Неделя)
      let weekHtml = `
        <div class="timeline-week-grid">
          <!-- Колонка шкалы часов слева -->
          <div class="timeline-week-time-col">
            <div class="timeline-week-time-header"></div>
      `;

      for (let h = minHour; h < maxHour; h++) {
        const hourLabel = `${String(h).padStart(2, '0')}:00`;
        weekHtml += `
          <div class="timeline-hour-row" style="border-right: none;">
            <div class="timeline-hour-label" style="border-right: none; width: 100%;">${hourLabel}</div>
          </div>
        `;
      }
      weekHtml += '</div>';

      // Колонки 7 дней
      dates.forEach(day => {
        const todayClass = day.isToday ? 'is-today' : '';
        weekHtml += `
          <div class="timeline-week-day-col" data-date="${day.dateStr}">
            <div class="timeline-week-day-header ${todayClass}">
              <span>${day.shortDay}</span>
              <span class="timeline-week-day-num">${day.displayDate}</span>
            </div>
        `;

        // Слоты часов для этого дня
        for (let h = minHour; h < maxHour; h++) {
          weekHtml += `
            <div class="timeline-hour-row">
              <div class="timeline-hour-slot" 
                   data-date="${day.dateStr}" 
                   data-hour="${h}"
                   ondragover="App.onTimelineSlotDragOver(event)" 
                   ondragleave="App.onTimelineSlotDragLeave(event)" 
                   ondrop="App.onTimelineSlotDrop(event, '${day.dateStr}', ${h})"
                   onclick="App.onTimelineSlotClick('${day.dateStr}', ${h})"
                   title="Запланировать на ${day.dateStr} в ${String(h).padStart(2, '0')}:00">
              </div>
            </div>
          `;
        }

        // Линия Сейчас для сегодняшней колонки
        if (day.isToday) {
          const now = new Date();
          const nowHours = now.getHours();
          const nowMins = now.getMinutes();
          const isVisible = nowHours >= minHour && nowHours < maxHour;
          const topPx = 40 + (nowHours * 60 + nowMins - minHour * 60);
          const timeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMins).padStart(2, '0')}`;
          weekHtml += `
            <div class="timeline-now-line" 
                 data-min-hour="${minHour}" 
                 data-max-hour="${maxHour}"
                 data-offset-top="40"
                 style="display: ${isVisible ? 'block' : 'none'}; top: ${topPx}px;">
              <div class="timeline-now-dot" style="left: 0;"></div>
              <span class="timeline-now-mini-badge">${timeStr}</span>
            </div>
          `;
        }

        // Блоки задач этого дня недели
        const dayTasks = candidateTasks.filter(t => t.timeBlock && t.timeBlock.date === day.dateStr);
        dayTasks.forEach(task => {
          const tb = task.timeBlock;
          const [startH, startM] = (tb.startTime || '09:00').split(':').map(Number);
          const startMins = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 0 : startM);
          const durationMins = tb.durationMinutes || 60;
          const topPx = 40 + (startMins - minHour * 60);
          const heightPx = Math.max(24, durationMins);
          const isRunning = TimerEngine.isRunning(task.id);
          const playIcon = isRunning ? '⏸' : '▶';
          const borderStyle = task.color ? `border-left-color: ${task.color};` : '';
          const bgStyle = task.color ? `background: linear-gradient(to right, ${task.color}20, var(--bg-card) 60%);` : '';

          weekHtml += `
            <div class="timeline-week-block ${task.completed ? 'completed' : ''}" 
                 id="week-timeline-block-${task.id}"
                 style="top: ${topPx}px; height: ${heightPx}px; ${borderStyle} ${bgStyle}"
                 draggable="true"
                 ondragstart="App.onDragStart(event, '${task.id}')"
                 ondragend="App.onDragEnd(event)"
                 onclick="App.openEditTaskModal('${task.id}')"
                 title="${this.escapeHtml(task.title)} (${tb.startTime} — ${tb.endTime})">
              <div class="timeline-block-header">
                <span class="timeline-block-title" style="font-size: 11px;">${this.escapeHtml(task.title)}</span>
                <div class="timeline-block-actions" onclick="event.stopPropagation()">
                  <button class="timeline-block-btn-play" onclick="App.toggleTaskTimer('${task.id}')" title="Таймер">${playIcon}</button>
                  <button class="timeline-block-btn-del" onclick="App.removeTaskTimeBlock('${task.id}')" title="Убрать">✕</button>
                </div>
              </div>
              <div class="timeline-block-time" style="font-size: 9.5px; cursor: pointer;" onclick="event.stopPropagation(); App.openTimelineIntervalPopover('${task.id}', event.clientX, event.clientY)" title="Нажмите для точной настройки интервала времени">${tb.startTime} - ${tb.endTime}</div>
              <div class="timeline-block-resize-handle" onmousedown="App.onTimelineResizeStart(event, '${task.id}')"></div>
            </div>
          `;
        });

        weekHtml += '</div>';
      });

      weekHtml += '</div>';
      container.innerHTML = weekHtml;
    }
  },

  // =========================================================================
  // ИНТЕРАКТИВНОСТЬ ТАЙМЛАЙНА: DRAG & DROP, РАСШИРЕНИЕ, КЛИК, УДАЛЕНИЕ
  // =========================================================================

  onTimelineSlotDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const slot = e.currentTarget;
    if (!slot) return;
    slot.classList.add('drag-over');

    const rect = slot.getBoundingClientRect();
    const offsetY = Math.max(0, Math.min(59, e.clientY - rect.top));
    const quarter = Math.min(3, Math.floor(offsetY / 15));
    const hour = parseInt(slot.getAttribute('data-hour'), 10) || 0;
    const mins = quarter * 15;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    let indicator = slot.querySelector('.timeline-quarter-highlight');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'timeline-quarter-highlight';
      slot.appendChild(indicator);
    }
    indicator.style.top = `${quarter * 15}px`;
    indicator.textContent = `⏱️ ${timeStr}`;
  },

  onTimelineSlotDragLeave(e) {
    const slot = e.currentTarget;
    if (slot) {
      slot.classList.remove('drag-over');
      const indicator = slot.querySelector('.timeline-quarter-highlight');
      if (indicator) indicator.remove();
    }
  },

  onTimelineSlotDrop(e, dateStr, hour) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.timeline-hour-slot').forEach(el => {
      el.classList.remove('drag-over');
      const ind = el.querySelector('.timeline-quarter-highlight');
      if (ind) ind.remove();
    });

    const taskId = this.draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Вычисляем точные 15 минут по положению курсора внутри 60px слота
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = Math.max(0, Math.min(59, e.clientY - rect.top));
    const quarter = Math.min(3, Math.floor(offsetY / 15));
    const mins = quarter * 15;

    // Длительность по умолчанию: берем из задачи, если уже была, иначе 60 минут
    const duration = task.timeBlock?.durationMinutes || 60;
    const startMins = hour * 60 + mins;
    const endMins = startMins + duration;

    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;

    const startTimeStr = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    task.dueDate = dateStr;
    task.timeBlock = {
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes: duration
    };

    task.updatedAt = new Date().toISOString();
    this.saveData();

    this.renderCurrentView();
    if (this.todayTimelineMode === 'split' && this.currentView === 'today') {
      this.renderTodayTimeline();
    }
    if (this.currentView === 'timeline') {
      this.renderTimelineView();
    }
    this.updateBadges();

    // Мгновенно открываем поповер точной настройки интервала прямо у курсора/блока
    this.openTimelineIntervalPopover(task.id, e.clientX, e.clientY);
  },

  onTimelineSlotClick(dateStr, hour) {
    let projectId = null;
    if (this.currentView === 'timeline') {
      if (this.timelineFilterProject && this.timelineFilterProject !== 'all') {
        projectId = this.timelineFilterProject;
      } else if (this.timelineFilterSection && this.timelineFilterSection !== 'all') {
        const sec = this.data.sections.find(s => s.id === this.timelineFilterSection);
        if (sec && sec.projects?.length > 0) projectId = sec.projects[0].id;
      }
    } else if (this.currentView === 'today') {
      if (this.todayFilterProject && this.todayFilterProject !== 'all') {
        projectId = this.todayFilterProject;
      } else if (this.todayFilterSection && this.todayFilterSection !== 'all') {
        const sec = this.data.sections.find(s => s.id === this.todayFilterSection);
        if (sec && sec.projects?.length > 0) projectId = sec.projects[0].id;
      }
    } else if (typeof this.currentView === 'object' && this.currentView.projectId) {
      projectId = this.currentView.projectId;
    }

    const startH = hour;
    const endH = (hour + 1) % 24;
    const startTimeStr = `${String(startH).padStart(2, '0')}:00`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:00`;

    this.openQuickCaptureModal({
      dueDate: dateStr,
      time: startTimeStr,
      hasReminder: true,
      projectId: projectId,
      timeBlock: {
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationMinutes: 60
      }
    });
  },

  removeTaskTimeBlock(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    delete task.timeBlock;
    task.updatedAt = new Date().toISOString();
    this.saveData();

    this.renderCurrentView();
    if (this.todayTimelineMode === 'split' && this.currentView === 'today') {
      this.renderTodayTimeline();
    }
    if (this.currentView === 'timeline') {
      this.renderTimelineView();
    }
    this.updateBadges();
  },

  onTimelineBadgeClick(taskId, event) {
    if (this.currentView === 'today') {
      if (this.todayTimelineMode !== 'split') {
        this.setTodayTimelineMode('split');
      }
      setTimeout(() => {
        const block = document.getElementById(`timeline-block-${taskId}`);
        if (block) {
          block.scrollIntoView({ behavior: 'smooth', block: 'center' });
          block.style.boxShadow = '0 0 12px var(--accent-primary)';
          setTimeout(() => block.style.boxShadow = '', 1500);
        }
      }, 150);
      if (event) {
        this.openTimelineIntervalPopover(taskId, event.clientX, event.clientY);
      }
    } else {
      this.selectView('timeline');
    }
  },

  // =========================================================================
  // ПОПОВЕР ТОЧНОЙ НАСТРОЙКИ ИНТЕРВАЛА ВРЕМЕНИ (v1.0.68)
  // =========================================================================

  popoverTargetTaskId: null,

  populateIntervalTimeSelects() {
    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');
    if (!startSel || !endSel) return;
    if (startSel.options.length > 0) return;

    let opts = '';
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        opts += `<option value="${timeStr}">${timeStr}</option>`;
      }
    }
    startSel.innerHTML = opts;
    endSel.innerHTML = opts + `<option value="24:00">24:00</option>`;
  },

  openTimelineIntervalPopover(taskId, clientX, clientY) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.populateIntervalTimeSelects();
    this.popoverTargetTaskId = taskId;

    const popover = document.getElementById('timeline-interval-popover');
    const titleEl = document.getElementById('popover-interval-task-title');
    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');

    if (!popover || !startSel || !endSel) return;

    if (titleEl) {
      titleEl.textContent = task.title;
      titleEl.title = task.title;
    }

    const tb = task.timeBlock || {};
    const startTime = tb.startTime || '09:00';
    const endTime = tb.endTime || '10:00';

    startSel.value = startTime;
    endSel.value = endTime;

    popover.style.display = 'flex';
    const popWidth = 310;
    const popHeight = 220;

    let posX = (clientX || (window.innerWidth / 2)) - (popWidth / 2);
    let posY = (clientY || (window.innerHeight / 2)) + 15;

    if (posX + popWidth > window.innerWidth - 20) {
      posX = window.innerWidth - popWidth - 20;
    }
    if (posX < 20) posX = 20;

    if (posY + popHeight > window.innerHeight - 20) {
      posY = Math.max(20, posY - popHeight - 35);
    }

    popover.style.left = `${posX}px`;
    popover.style.top = `${posY}px`;
  },

  onPopoverStartChanged() {
    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');
    if (!startSel || !endSel) return;

    const [sh, sm] = startSel.value.split(':').map(Number);
    const startMins = sh * 60 + sm;

    const [eh, em] = endSel.value.split(':').map(Number);
    const endMins = (eh === 24 ? 24 * 60 : eh * 60 + em);

    let duration = endMins - startMins;
    if (duration <= 0) duration = 60;

    const newEndMins = Math.min(24 * 60, startMins + duration);
    const newEh = Math.floor(newEndMins / 60);
    const newEm = newEndMins % 60;
    const newEndStr = `${String(newEh).padStart(2, '0')}:${String(newEm).padStart(2, '0')}`;
    endSel.value = newEndStr;
  },

  onPopoverEndChanged() {
    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');
    if (!startSel || !endSel) return;

    const [sh, sm] = startSel.value.split(':').map(Number);
    const startMins = sh * 60 + sm;

    const [eh, em] = endSel.value.split(':').map(Number);
    const endMins = (eh === 24 ? 24 * 60 : eh * 60 + em);

    if (endMins <= startMins) {
      const newEndMins = Math.min(24 * 60, startMins + 15);
      const newEh = Math.floor(newEndMins / 60);
      const newEm = newEndMins % 60;
      endSel.value = `${String(newEh).padStart(2, '0')}:${String(newEm).padStart(2, '0')}`;
    }
  },

  setPopoverDuration(durationMinutes) {
    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');
    if (!startSel || !endSel) return;

    const [sh, sm] = startSel.value.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const newEndMins = Math.min(24 * 60, startMins + durationMinutes);
    const newEh = Math.floor(newEndMins / 60);
    const newEm = newEndMins % 60;
    endSel.value = `${String(newEh).padStart(2, '0')}:${String(newEm).padStart(2, '0')}`;
  },

  saveTimelineIntervalPopover() {
    if (!this.popoverTargetTaskId) {
      this.closeTimelineIntervalPopover();
      return;
    }

    const task = this.data.tasks.find(t => t.id === this.popoverTargetTaskId);
    if (!task) {
      this.closeTimelineIntervalPopover();
      return;
    }

    const startSel = document.getElementById('popover-interval-start');
    const endSel = document.getElementById('popover-interval-end');
    if (!startSel || !endSel) return;

    const startTime = startSel.value;
    const endTime = endSel.value;

    const [sh, sm] = startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const [eh, em] = endTime.split(':').map(Number);
    const endMins = (eh === 24 ? 24 * 60 : eh * 60 + em);
    const durationMinutes = Math.max(15, endMins - startMins);

    const targetDate = task.timeBlock?.date || task.dueDate || this.getLocalDateStr();

    task.timeBlock = {
      date: targetDate,
      startTime: startTime,
      endTime: endTime,
      durationMinutes: durationMinutes
    };
    task.dueDate = targetDate;
    task.updatedAt = new Date().toISOString();

    this.saveData();
    this.closeTimelineIntervalPopover();

    this.renderCurrentView();
    this.updateBadges();
  },

  removePopoverTaskFromTimeline() {
    if (this.popoverTargetTaskId) {
      this.removeTaskTimeBlock(this.popoverTargetTaskId);
    }
    this.closeTimelineIntervalPopover();
  },

  closeTimelineIntervalPopover() {
    const popover = document.getElementById('timeline-interval-popover');
    if (popover) popover.style.display = 'none';
    this.popoverTargetTaskId = null;
  },

  // =========================================================================
  // ИЗМЕНЕНИЕ ДЛИТЕЛЬНОСТИ БЛОКА (RESIZE MOUSE HANDLER)
  // =========================================================================

  onTimelineResizeStart(e, taskId) {
    e.stopPropagation();
    e.preventDefault();

    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task || !task.timeBlock) return;

    this.resizingTimelineBlock = {
      taskId: taskId,
      startY: e.clientY,
      initialDuration: task.timeBlock.durationMinutes || 60,
      startTime: task.timeBlock.startTime || '09:00',
      blockEl: e.currentTarget.closest('.timeline-block, .timeline-week-block')
    };

    document.body.style.cursor = 'ns-resize';
  },

  onTimelineResizeMove(e) {
    if (!this.resizingTimelineBlock) return;

    const { startY, initialDuration, startTime, blockEl } = this.resizingTimelineBlock;
    const deltaY = e.clientY - startY;

    // 60px = 60 минут => ровно 1px = 1 минута, шаг 15 минут
    const deltaMins = Math.round(deltaY / 15) * 15;
    const newDuration = Math.max(15, initialDuration + deltaMins);

    if (blockEl) {
      const newHeight = Math.max(24, newDuration);
      blockEl.style.height = `${newHeight}px`;

      const [startH, startM] = startTime.split(':').map(Number);
      const endTotalMins = startH * 60 + startM + newDuration;
      const endH = Math.floor(endTotalMins / 60) % 24;
      const endM = endTotalMins % 60;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const timeLabel = blockEl.querySelector('.timeline-block-time');
      if (timeLabel) {
        timeLabel.textContent = `⏱️ ${startTime} — ${endStr} (${newDuration}м)`;
      }
    }
  },

  onTimelineResizeEnd(e) {
    if (!this.resizingTimelineBlock) return;

    const { taskId, startY, initialDuration, startTime } = this.resizingTimelineBlock;
    this.resizingTimelineBlock = null;
    document.body.style.cursor = '';

    const deltaY = e.clientY - startY;
    const deltaMins = Math.round(deltaY / 15) * 15;
    const newDuration = Math.max(15, initialDuration + deltaMins);

    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task || !task.timeBlock) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const endTotalMins = startH * 60 + startM + newDuration;
    const endH = Math.floor(endTotalMins / 60) % 24;
    const endM = endTotalMins % 60;
    const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    task.timeBlock.durationMinutes = newDuration;
    task.timeBlock.endTime = endStr;
    task.updatedAt = new Date().toISOString();

    this.saveData();

    if (this.todayTimelineMode === 'split' && this.currentView === 'today') {
      this.renderTodayTimeline();
    }
    if (this.currentView === 'timeline') {
      this.renderTimelineView();
    }
    this.renderCurrentView();
  },

  // =========================================================================
  // СВОРАЧИВАНИЕ / РАЗВОРАЧИВАНИЕ БОКОВОЙ ПАНЕЛИ (v1.0.69)
  // =========================================================================

  toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (typeof forceState === 'boolean') {
      this.sidebarCollapsed = forceState;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
    document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);

    if (!this.data.settings) this.data.settings = {};
    this.data.settings.sidebarCollapsed = this.sidebarCollapsed;
    this.saveData();
  },

  // =========================================================================
  // ИНТЕРАКТИВНОЕ ИЗМЕНЕНИЕ ШИРИНЫ КОЛОНОК (COLUMN RESIZERS) (v1.0.69)
  // =========================================================================

  onColumnResizeStart(e, type) {
    e.preventDefault();
    e.stopPropagation();

    let targetEl = null;
    let containerEl = null;
    let initialWidth = 0;

    if (type === 'today') {
      targetEl = document.getElementById('today-timeline-col');
      containerEl = document.getElementById('today-split-wrapper');
      if (!targetEl || !containerEl) return;
      initialWidth = targetEl.offsetWidth;
    } else if (type === 'timeline') {
      targetEl = document.getElementById('timeline-backlog-panel');
      containerEl = document.querySelector('.timeline-main-layout');
      if (!targetEl || !containerEl) return;
      initialWidth = targetEl.offsetWidth;
    }

    this.activeColumnResizer = {
      type,
      startX: e.clientX,
      initialWidth,
      targetEl,
      containerEl
    };

    const resizerEl = e.currentTarget;
    if (resizerEl) resizerEl.classList.add('is-resizing');

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  },

  onColumnResizeMove(e) {
    if (!this.activeColumnResizer) return;

    const { type, startX, initialWidth, targetEl, containerEl } = this.activeColumnResizer;
    const deltaX = e.clientX - startX;

    if (type === 'today') {
      // Правая колонка (шкала времени в Сегодня): движение мыши влево увеличивает шкалу
      const containerWidth = containerEl.offsetWidth;
      const minTimelineWidth = 280;
      const maxTimelineWidth = Math.min(850, containerWidth - 420);
      const newWidth = Math.max(minTimelineWidth, Math.min(maxTimelineWidth, initialWidth - deltaX));
      targetEl.style.width = `${newWidth}px`;
    } else if (type === 'timeline') {
      // Левая колонка (беклог в Расписании): движение мыши вправо увеличивает панель
      const containerWidth = containerEl.offsetWidth;
      const minBacklogWidth = 200;
      const maxBacklogWidth = Math.min(750, containerWidth - 450);
      const newWidth = Math.max(minBacklogWidth, Math.min(maxBacklogWidth, initialWidth + deltaX));
      targetEl.style.width = `${newWidth}px`;
    }
  },

  onColumnResizeEnd(e) {
    if (!this.activeColumnResizer) return;

    const { type, targetEl } = this.activeColumnResizer;
    this.activeColumnResizer = null;

    document.querySelectorAll('.column-resizer').forEach(el => el.classList.remove('is-resizing'));
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (!targetEl) return;
    const finalWidth = targetEl.offsetWidth;

    if (!this.data.settings) this.data.settings = {};

    if (type === 'today') {
      this.data.settings.todayTimelineWidth = finalWidth;
    } else if (type === 'timeline') {
      this.data.settings.timelineBacklogWidth = finalWidth;
    }

    this.saveData();
  },

  // Генератор HTML карточки задачи для использования в любых экранах
  renderTaskCardHtml(task) {
    const folderInfo = this.findFolderInfo(task.projectId);
    const projName = folderInfo ? folderInfo.folder.name : 'Общие';
    const projIcon = folderInfo ? (folderInfo.folder.icon || '📂') : '📂';
    const secIcon = folderInfo ? (folderInfo.section.icon || '💼') : '💼';

    const isRunning = TimerEngine.isRunning(task.id);
    const elapsedSec = TimerEngine.getElapsedSeconds(task.id) || task.timeSpentSeconds || 0;
    const formattedTime = TimerEngine.formatTimeDigits(elapsedSec);
    const timerBtnClass = isRunning ? 'btn-task-timer running' : 'btn-task-timer';
    const timerIcon = isRunning ? '⏸' : '▶';

    const taskColorStyle = task.color ? `border-left: 5px solid ${task.color}; background: linear-gradient(to right, ${task.color}15, var(--bg-card) 25%);` : '';

    const dateBadges = this.formatTaskDateBadge(task);

    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const hasSubtasks = subtasks.length > 0;
    const hasDesc = !!(task.description && task.description.trim());
    const isSubtasksExpanded = !task.subtasksCollapsed;
    const isDescExpanded = !task.descriptionCollapsed;

    let descToggleBtn = '';
    if (hasDesc) {
      const activeClass = isDescExpanded ? 'active' : '';
      descToggleBtn = `
        <button type="button" class="btn-toggle-subtasks ${activeClass}" onclick="App.toggleTaskDescriptionCollapse('${task.id}')" title="Показать / скрыть описание задачи">
          <span>${isDescExpanded ? '▾' : '▸'}</span>
          <span>📝 Описание</span>
        </button>
      `;
    }

    let subtasksToggleBtn = '';
    if (hasSubtasks) {
      const doneCount = subtasks.filter(s => s.completed).length;
      const totalCount = subtasks.length;
      const allDoneClass = (totalCount > 0 && doneCount === totalCount) ? 'all-done' : '';
      const activeClass = isSubtasksExpanded ? 'active' : '';

      subtasksToggleBtn = `
        <button type="button" class="btn-toggle-subtasks ${activeClass} ${allDoneClass}" onclick="App.toggleTaskSubtasksCollapse('${task.id}')" title="Показать / скрыть подпункты">
          <span>${isSubtasksExpanded ? '▾' : '▸'}</span>
          <span>☑ ${doneCount}/${totalCount} подпунктов</span>
        </button>
      `;
    }

    const formattedTitle = this.formatTitleWithHashtags(task.title);

    const attachments = Array.isArray(task.attachments) ? task.attachments : [];
    const hasAttachments = attachments.length > 0;
    const isAttachmentsExpanded = !task.attachmentsCollapsed;

    let attachmentsToggleBtn = '';
    if (hasAttachments) {
      const activeClass = isAttachmentsExpanded ? 'active' : '';
      const linkCount = attachments.filter(a => a.type === 'url').length;
      const isAllLinks = linkCount === attachments.length;
      const count = attachments.length;
      const suffix = count === 1 ? 'ссылка' : (count < 5 ? 'ссылки' : 'ссылок');
      const label = isAllLinks ? `🌐 ${count} ${suffix}` : `📎 ${count} влож.`;

      attachmentsToggleBtn = `
        <button type="button" class="btn-toggle-subtasks ${activeClass}" onclick="App.toggleTaskAttachmentsCollapse('${task.id}')" title="Показать / скрыть ссылки и материалы задачи">
          <span>${isAttachmentsExpanded ? '▾' : '▸'}</span>
          <span>${label}</span>
        </button>
      `;
    }

    let attachmentsHtml = '';
    if (hasAttachments && isAttachmentsExpanded) {
      attachmentsHtml = `
        <div class="task-attachments-row">
          ${attachments.map(att => {
            if (att.type === 'url') {
              const domain = this.getDomainFromUrl(att.url);
              const title = att.title || domain;
              return `
                <span class="attachment-chip chip-url" data-url="${this.escapeHtml(att.url)}" onclick="event.stopPropagation(); App.openAttachmentUrl(this.dataset.url)" title="Открыть ссылку: ${this.escapeHtml(att.url)}">
                  <span class="chip-icon">🌐</span>
                  <span class="chip-title">${this.escapeHtml(title)}</span>
                </span>
              `;
            } else if (att.type === 'path') {
              const name = att.title || att.name || 'Папка';
              const cleanPath = (att.path || '').replace(/'/g, "\\'");
              return `
                <span class="attachment-chip chip-path" onclick="event.stopPropagation(); App.openAttachmentPath('${this.escapeHtml(cleanPath)}')" title="Открыть в проводнике: ${this.escapeHtml(att.path)}">
                  <span class="chip-icon">📁</span>
                  <span class="chip-title">${this.escapeHtml(name)}</span>
                </span>
              `;
            } else if (att.type === 'image') {
              const title = att.title || 'Скриншот';
              return `<img class="task-attachment-thumb" src="${att.dataUrl}" onclick="event.stopPropagation(); App.openImageLightbox('${att.dataUrl}', '${this.escapeHtml(title)}')" title="${this.escapeHtml(title)} (клик для увеличения)">`;
            }
            return '';
          }).join('')}
        </div>
      `;
    }

    const hasNote = !!(task.noteHtml && task.noteHtml.trim());
    let noteToggleBtn = '';
    if (hasNote) {
      noteToggleBtn = `
        <button type="button" class="btn-toggle-subtasks active" onclick="event.stopPropagation(); App.openTaskNoteModal('${task.id}')" title="Открыть подробную заметку и инструкцию">
          <span>📖 Открыть заметку</span>
        </button>
      `;
    }

    const hasTaskTime = (task.timeSpentSeconds > 0) || TimerEngine.isRunning(task.id);

    return `
      <div class="task-item" 
           id="task-row-${task.id}"
           style="${taskColorStyle}"
           ondragover="App.onDragOver(event)"
           ondragleave="App.onDragLeave(event)"
           ondrop="App.onDrop(event, '${task.id}')">
        
        <div class="task-main-row">
          <div class="drag-handle" 
               draggable="true" 
               ondragstart="App.onDragStart(event, '${task.id}')"
               ondragend="App.onDragEnd(event)"
               title="Перетащить для изменения порядка">⋮⋮</div>

          <div class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" draggable="false" title="Отметить как выполненное" onchange="App.completeTask('${task.id}')">
          </div>

          <div class="task-content">
            <div class="task-title" id="task-title-${task.id}" draggable="false" ondblclick="App.startInlineEditTask('${task.id}')" title="Двойной клик для быстрого переименования">
              ${formattedTitle}
            </div>
            <div class="task-meta-row">
              <span class="tag-project" onclick="App.selectView({ sectionId: '${task.sectionId}', projectId: '${task.projectId}' })" style="cursor: pointer;">
                ${secIcon} ${projIcon} ${this.escapeHtml(projName)}
              </span>
              ${task.repeat && task.repeat !== 'none' ? `<span class="task-repeat-badge" title="Повторяющаяся задача">🔁 ${this.formatRepeatName(task.repeat)}</span>` : ''}
              ${dateBadges}
              ${task.timeBlock && task.timeBlock.startTime ? `
                <span class="task-timeline-badge" onclick="event.stopPropagation(); App.onTimelineBadgeClick('${task.id}', event)" title="Запланировано на ${task.timeBlock.startTime} — ${task.timeBlock.endTime} (клик для настройки)">
                  ⏱️ ${task.timeBlock.startTime} — ${task.timeBlock.endTime}
                </span>
              ` : ''}
              ${descToggleBtn}
              ${subtasksToggleBtn}
              ${attachmentsToggleBtn}
              ${noteToggleBtn}
            </div>
            ${attachmentsHtml}
          </div>

          <div class="task-actions">
            <button class="${timerBtnClass}" id="timer-btn-${task.id}" onclick="App.toggleTaskTimer('${task.id}')" title="Запустить/остановить таймер">
              <span>${timerIcon}</span>
              <span id="timer-text-${task.id}">${formattedTime}</span>
            </button>
            ${hasTaskTime ? `
              <button class="btn-icon btn-reset-timer" title="Сбросить накопленное время таймера в 00:00" onclick="event.stopPropagation(); App.resetTaskTimer('${task.id}')">↺</button>
            ` : ''}
            <button class="btn-icon" title="⏱️ Указать / изменить время задачи вручную" onclick="event.stopPropagation(); App.openManualTimeLogForTask('${task.id}')">⏱️</button>

            <button class="btn-icon" title="📖 Открыть заметку / регламент" onclick="event.stopPropagation(); App.openTaskNoteModal('${task.id}')" style="${hasNote ? 'color: var(--accent-primary); font-weight: bold;' : ''}">📖</button>
            <button class="btn-icon" title="Дублировать задачу" onclick="App.duplicateTask('${task.id}')">📋</button>
            <button class="btn-icon" title="Срок и напоминание" onclick="App.openEditTaskModal('${task.id}')">📅</button>
            <button class="btn-icon" title="Редактировать задачу / Подпункты" onclick="App.openEditTaskModal('${task.id}')">✏️</button>
            <button class="btn-icon btn-delete" title="Удалить задачу" onclick="App.deleteTask('${task.id}')">🗑</button>
          </div>
        </div>

        <!-- Развернутый блок описания и/или подпунктов -->
        ${(hasDesc && isDescExpanded) || (hasSubtasks && isSubtasksExpanded) ? `
          <div class="task-details-wrapper">
            ${hasDesc && isDescExpanded ? `<div class="task-description-box" title="Описание задачи">${this.escapeHtml((task.description || '').trim())}</div>` : ''}

            ${hasSubtasks && isSubtasksExpanded ? `
              <div class="task-subtasks-tree">
                ${subtasks.map(sub => {
                  const subTimerKey = `${task.id}:::sub:::${sub.id}`;
                  const isSubRunning = TimerEngine.isRunning(subTimerKey);
                  const subElapsed = isSubRunning ? TimerEngine.getElapsedSeconds(subTimerKey) : (sub.timeSpentSeconds || 0);
                  const subFormatted = TimerEngine.formatTimeDigits(subElapsed);
                  const timerBtnClass = `btn-subtask-timer ${isSubRunning ? 'running' : ''}`;
                  const timerIcon = isSubRunning ? '⏸' : '▶';

                  return `
                    <div class="subtask-row" id="subtask-row-${task.id}-${sub.id}">
                      <input type="checkbox" class="subtask-checkbox" draggable="false" ${sub.completed ? 'checked' : ''} onchange="App.toggleSubtask('${task.id}', '${sub.id}')">
                      <span class="subtask-text ${sub.completed ? 'completed' : ''}">${this.escapeHtml(sub.text)}</span>
                      
                      <div class="subtask-actions">
                        <button type="button" class="${timerBtnClass}" id="timer-btn-sub-${task.id}-${sub.id}" onclick="App.toggleSubtaskTimer('${task.id}', '${sub.id}')" title="Старт / Пауза таймера подпункта">
                          <span>${timerIcon}</span>
                          <span id="timer-text-sub-${task.id}-${sub.id}">${subFormatted}</span>
                        </button>
                        ${subElapsed > 0 ? `
                          <button type="button" class="btn-icon btn-reset-sub-timer" title="Сбросить время подпункта в 00:00" onclick="event.stopPropagation(); App.resetSubtaskTimer('${task.id}', '${sub.id}')">↺</button>
                        ` : ''}
                        <button type="button" class="btn-subtask-time-edit" onclick="event.stopPropagation(); App.openManualTimeLogForTask('${task.id}', '${sub.id}')" title="⏱️ Указать / изменить время подпункта вручную">
                          ⏱️
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
                <input type="text" class="subtask-inline-add-input" draggable="false" placeholder="+ Добавить подпункт... (Нажмите Enter)" onkeydown="if(event.key === 'Enter') App.quickAddSubtask('${task.id}', this)">
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  // =========================================================================
  // Рендеринг активных задач
  // =========================================================================
  renderCurrentView() {
    if (this.currentView === 'archive') {
      this.renderArchive();
      return;
    }

    if (this.currentView === 'week' || this.currentView === 'month') {
      this.renderPeriodView();
      return;
    }

    if (this.currentView === 'reminders') {
      this.renderRemindersView();
      return;
    }

    if (this.currentView === 'stats') {
      this.renderStatsView();
      return;
    }

    if (this.currentView === 'timeline') {
      this.renderTimelineView();
      return;
    }

    if (this.currentView === 'help') {
      return;
    }

    const container = document.getElementById('tasks-list');
    const emptyState = document.getElementById('tasks-empty-state');
    if (!container) return;

    const todayFilterBar = document.getElementById('today-filters-bar');
    if (this.currentView === 'today') {
      if (todayFilterBar) todayFilterBar.style.display = 'block';
      this.populateTodayFiltersSelects();
      if (this.todayTimelineMode === 'split') {
        this.renderTodayTimeline();
      }
    } else {
      if (todayFilterBar) todayFilterBar.style.display = 'none';
    }

    let filtered = this.data.tasks.filter(t => !t.completed);

    if (this.currentView === 'today') {
      const todayStr = this.getLocalDateStr();
      filtered = filtered.filter(t => {
        const d = t.dueDate || (t.timeBlock ? t.timeBlock.date : null) || (t.reminderTime ? this.getLocalDateStr(new Date(t.reminderTime)) : null);
        return d === todayStr;
      });

      // 1. Фильтрация по категории / разделу
      if (this.todayFilterSection && this.todayFilterSection !== 'all') {
        filtered = filtered.filter(t => t.sectionId === this.todayFilterSection);
      }

      // 2. Фильтрация по конкретной папке / проекту (включая вложенные подпапки)
      if (this.todayFilterProject && this.todayFilterProject !== 'all') {
        const fInfo = this.findFolderInfo(this.todayFilterProject);
        if (fInfo) {
          const allFolderIds = this.getAllChildFolderIds(fInfo.folder);
          filtered = filtered.filter(t => allFolderIds.includes(t.projectId));
        } else {
          filtered = filtered.filter(t => t.projectId === this.todayFilterProject);
        }
      }

      // 3. Сортировка задач на сегодня
      if (this.todaySortBy === 'time_asc') {
        filtered.sort((a, b) => {
          const timeA = a.timeBlock?.startTime || (a.reminderTime ? a.reminderTime.slice(11, 16) : '') || '99:99';
          const timeB = b.timeBlock?.startTime || (b.reminderTime ? b.reminderTime.slice(11, 16) : '') || '99:99';
          return timeA.localeCompare(timeB);
        });
      } else if (this.todaySortBy === 'spent_desc') {
        filtered.sort((a, b) => (b.timeSpentSeconds || 0) - (a.timeSpentSeconds || 0));
      } else if (this.todaySortBy === 'title_asc') {
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));
      } else if (this.todaySortBy === 'default') {
        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    } else if (typeof this.currentView === 'object' && this.currentView.type === 'tag') {
      const targetTag = this.currentView.tag.toLowerCase();
      filtered = filtered.filter(t => this.extractHashtags(t.title).includes(targetTag));
    } else if (typeof this.currentView === 'object' && this.currentView.sectionId && this.currentView.projectId) {
      const folderInfo = this.findFolderInfo(this.currentView.projectId);
      if (folderInfo) {
        const allFolderIds = this.getAllChildFolderIds(folderInfo.folder);
        filtered = filtered.filter(t => t.sectionId === this.currentView.sectionId && allFolderIds.includes(t.projectId));
      } else {
        filtered = filtered.filter(t => t.sectionId === this.currentView.sectionId && t.projectId === this.currentView.projectId);
      }
    }

    if (this.currentSearchQuery.trim()) {
      const q = this.currentSearchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    if (this.currentView !== 'today') {
      filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    let html = '';

    // Если в режиме "Сегодня" выбрана группировка по проектам или категориям:
    if (this.currentView === 'today' && this.todaySortBy === 'group_project') {
      const groups = new Map();
      filtered.forEach(task => {
        const folderInfo = this.findFolderInfo(task.projectId);
        const pName = folderInfo ? `${folderInfo.section.name} / ${folderInfo.folder.name}` : '📁 Без папки';
        const pIcon = folderInfo?.folder?.icon || '📂';
        const key = `${task.sectionId}:::${task.projectId}`;
        if (!groups.has(key)) {
          groups.set(key, { name: pName, icon: pIcon, tasks: [] });
        }
        groups.get(key).tasks.push(task);
      });

      groups.forEach(g => {
        html += `
          <div class="today-group-header">
            <span>${g.icon}</span>
            <span>${this.escapeHtml(g.name)}</span>
            <span class="today-group-badge">${g.tasks.length}</span>
          </div>
        `;
        g.tasks.forEach(task => {
          html += this.renderTaskCardHtml(task);
        });
      });
    } else if (this.currentView === 'today' && this.todaySortBy === 'group_section') {
      const groups = new Map();
      filtered.forEach(task => {
        const sec = this.data.sections.find(s => s.id === task.sectionId);
        const sName = sec ? sec.name : '🏷️ Без категории';
        const sIcon = sec?.icon || '📁';
        const key = task.sectionId;
        if (!groups.has(key)) {
          groups.set(key, { name: sName, icon: sIcon, tasks: [] });
        }
        groups.get(key).tasks.push(task);
      });

      groups.forEach(g => {
        html += `
          <div class="today-group-header">
            <span>${g.icon}</span>
            <span>${this.escapeHtml(g.name)}</span>
            <span class="today-group-badge">${g.tasks.length}</span>
          </div>
        `;
        g.tasks.forEach(task => {
          html += this.renderTaskCardHtml(task);
        });
      });
    } else {
      filtered.forEach(task => {
        html += this.renderTaskCardHtml(task);
      });
    }

    container.innerHTML = html;
  },

  todayFilterSection: 'all',
  todayFilterProject: 'all',
  todaySortBy: 'default',

  onTodayFilterSectionChange(secId) {
    this.todayFilterSection = secId;
    if (secId !== 'all' && this.todayFilterProject !== 'all') {
      const fInfo = this.findFolderInfo(this.todayFilterProject);
      if (fInfo && fInfo.section.id !== secId) {
        this.todayFilterProject = 'all';
      }
    }
    this.syncNewTaskSelectWithTodayFilters();
    this.renderCurrentView();
  },

  onTodayFilterProjectChange(projId) {
    this.todayFilterProject = projId;
    if (projId !== 'all') {
      const fInfo = this.findFolderInfo(projId);
      if (fInfo) {
        this.todayFilterSection = fInfo.section.id;
      }
    }
    this.syncNewTaskSelectWithTodayFilters();
    this.renderCurrentView();
  },

  onTodaySortChange(sortBy) {
    this.todaySortBy = sortBy;
    this.renderCurrentView();
  },

  resetTodayFilters() {
    this.todayFilterSection = 'all';
    this.todayFilterProject = 'all';
    this.todaySortBy = 'default';
    this.renderCurrentView();
  },

  syncNewTaskSelectWithTodayFilters() {
    const mainSelect = document.getElementById('new-task-project-select');
    if (!mainSelect) return;
    if (this.todayFilterProject !== 'all') {
      const fInfo = this.findFolderInfo(this.todayFilterProject);
      if (fInfo) {
        mainSelect.value = `${fInfo.section.id}:::${fInfo.folder.id}`;
      }
    } else if (this.todayFilterSection !== 'all') {
      const sec = this.data.sections.find(s => s.id === this.todayFilterSection);
      if (sec && sec.projects && sec.projects.length > 0) {
        mainSelect.value = `${sec.id}:::${sec.projects[0].id}`;
      }
    }
  },

  populateTodayFiltersSelects() {
    const secSelect = document.getElementById('today-filter-section');
    const projSelect = document.getElementById('today-filter-project');
    const sortSelect = document.getElementById('today-sort-by');
    const resetBtn = document.getElementById('btn-today-reset-filters');

    if (resetBtn) {
      const hasActiveFilter = (this.todayFilterSection !== 'all' || this.todayFilterProject !== 'all' || this.todaySortBy !== 'default');
      resetBtn.style.display = hasActiveFilter ? 'inline-block' : 'none';
    }

    if (sortSelect) {
      sortSelect.value = this.todaySortBy || 'default';
    }

    if (secSelect) {
      let secHtml = '<option value="all">🏷️ Все категории (разделы)</option>';
      this.data.sections.forEach(sec => {
        secHtml += `<option value="${sec.id}">${sec.icon || '📁'} ${this.escapeHtml(sec.name)}</option>`;
      });
      secSelect.innerHTML = secHtml;
      secSelect.value = this.todayFilterSection || 'all';
    }

    if (projSelect) {
      let projHtml = '<option value="all">📁 Все папки и проекты</option>';
      const targetSections = this.todayFilterSection !== 'all' 
        ? this.data.sections.filter(s => s.id === this.todayFilterSection)
        : this.data.sections;

      targetSections.forEach(sec => {
        if (sec.projects && sec.projects.length > 0) {
          projHtml += `<optgroup label="${sec.icon || '📁'} ${this.escapeHtml(sec.name)}">`;
          const buildTree = (folders, indent = '') => {
            folders.forEach(f => {
              projHtml += `<option value="${f.id}">${indent}${f.icon || '📂'} ${this.escapeHtml(f.name)}</option>`;
              if (f.children && f.children.length > 0) {
                buildTree(f.children, indent + '　└ ');
              }
            });
          };
          buildTree(sec.projects);
          projHtml += `</optgroup>`;
        }
      });
      projSelect.innerHTML = projHtml;
      projSelect.value = this.todayFilterProject || 'all';
    }
  },

  onSearchTasks(query) {
    this.currentSearchQuery = query;
    this.renderCurrentView();
  },

  startInlineEditTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    const titleEl = document.getElementById(`task-title-${taskId}`);
    if (!task || !titleEl) return;

    const originalTitle = task.title;
    titleEl.innerHTML = `
      <input type="text" class="task-inline-edit-input" id="inline-edit-input-${taskId}" value="${this.escapeHtml(originalTitle)}">
    `;

    const input = document.getElementById(`inline-edit-input-${taskId}`);
    if (input) {
      input.focus();
      input.select();

      const save = () => {
        const val = input.value.trim();
        if (val) {
          task.title = val;
          task.updatedAt = new Date().toISOString();
          this.saveData();
        }
        this.renderCurrentView();
        this.renderSidebar();
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          save();
        } else if (e.key === 'Escape') {
          this.renderCurrentView();
        }
      };

      input.onblur = () => {
        save();
      };
    }
  },

  // =========================================================================
  // Модальное окно редактирования задачи
  // =========================================================================
  openEditTaskModal(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId) || 
                 (this.data.completedTasks || []).find(t => t.id === taskId);
    if (!task) {
      const log = (this.data.timeLogs || []).find(l => l.id === taskId || l.taskId === taskId);
      if (log) {
        this.openManualTimeLogModal(log.id);
        return;
      }
      return;
    }

    document.getElementById('modal-task-edit-id').value = task.id;
    document.getElementById('modal-task-name').value = task.title;
    document.getElementById('modal-task-desc').value = task.description || '';

    this.selectTaskModalColor(task.color || '');

    const projSelect = document.getElementById('modal-task-project-select');
    if (projSelect) {
      const folderInfo = this.findFolderInfo(task.projectId);
      const actualSecId = folderInfo ? folderInfo.section.id : (task.sectionId || 'work');
      const actualProjId = folderInfo ? folderInfo.folder.id : (task.projectId || 'proj-work-general');
      const targetVal = `${actualSecId}:::${actualProjId}`;

      this.populateProjectSelects(targetVal);

      let matched = false;
      for (let i = 0; i < projSelect.options.length; i++) {
        const opt = projSelect.options[i];
        if (opt.value === targetVal || opt.value.endsWith(`:::${actualProjId}`)) {
          projSelect.selectedIndex = i;
          opt.selected = true;
          projSelect.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const fallbackOpt = document.createElement('option');
        fallbackOpt.value = targetVal;
        fallbackOpt.textContent = `📁 ${folderInfo?.folder?.name || task.projectId || 'Папка'}`;
        fallbackOpt.selected = true;
        projSelect.appendChild(fallbackOpt);
        projSelect.selectedIndex = projSelect.options.length - 1;
        projSelect.value = targetVal;
      }
    }

    this.renderModalSubtasksList(task.subtasks || []);

    const dateInput = document.getElementById('modal-task-date');
    const hasReminderCheck = document.getElementById('modal-task-has-reminder');
    const timeBox = document.getElementById('modal-task-time-box');
    const timeInput = document.getElementById('modal-task-time');

    const dStr = task.dueDate || (task.reminderTime ? task.reminderTime.slice(0, 10) : '');
    dateInput.value = dStr;

    const advanceSelect = document.getElementById('modal-task-reminder-advance');
    const advanceAlsoWrap = document.getElementById('modal-task-advance-also-wrap');
    const advanceAlsoExact = document.getElementById('modal-task-advance-also-exact');

    if (task.reminderTime) {
      if (hasReminderCheck) hasReminderCheck.checked = true;
      if (timeBox) timeBox.style.display = 'flex';
      const d = new Date(task.reminderTime);
      if (timeInput) timeInput.value = d.toTimeString().slice(0, 5);
      const advMins = parseInt(task.reminderAdvance, 10) || 0;
      if (advanceSelect) advanceSelect.value = String(advMins);
      if (advanceAlsoWrap) advanceAlsoWrap.style.display = advMins > 0 ? 'flex' : 'none';
      if (advanceAlsoExact) advanceAlsoExact.checked = (task.reminderAdvanceAlsoExact !== false);
    } else {
      if (hasReminderCheck) hasReminderCheck.checked = false;
      if (timeBox) timeBox.style.display = 'none';
      if (timeInput) timeInput.value = '12:00';
      if (advanceSelect) advanceSelect.value = '0';
      if (advanceAlsoWrap) advanceAlsoWrap.style.display = 'none';
      if (advanceAlsoExact) advanceAlsoExact.checked = true;
    }

    const repeatSelect = document.getElementById('modal-task-repeat');
    if (repeatSelect) repeatSelect.value = task.repeat || 'none';

    // Инициализация вложений
    this.tempTaskAttachments = JSON.parse(JSON.stringify(task.attachments || []));
    this.renderModalAttachments();

    // Заполнение полей времени задачи
    const taskSec = TimerEngine.getElapsedSeconds(task.id) || task.timeSpentSeconds || 0;
    const hours = Math.floor(taskSec / 3600);
    const minutes = Math.floor((taskSec % 3600) / 60);
    const hoursInput = document.getElementById('modal-task-hours');
    const minsInput = document.getElementById('modal-task-minutes');
    const timeDisplay = document.getElementById('modal-task-time-display');
    if (hoursInput) hoursInput.value = hours > 0 ? hours : '';
    if (minsInput) minsInput.value = minutes > 0 ? minutes : '';
    if (timeDisplay) timeDisplay.textContent = TimerEngine.formatTimeReadable(taskSec);

    // Режим авторасчета интервала
    const savedMode = localStorage.getItem('planer_time_log_calc_mode') || 'until_now';
    this.timeLogCalcMode = savedMode;
    const modeInput = document.getElementById('modal-task-calc-mode');
    if (modeInput) modeInput.value = savedMode;
    const untilBtn = document.getElementById('btn-task-calc-mode-until-now');
    const fromBtn = document.getElementById('btn-task-calc-mode-from-now');
    if (savedMode === 'until_now') {
      if (untilBtn) untilBtn.classList.add('active');
      if (fromBtn) fromBtn.classList.remove('active');
    } else {
      if (untilBtn) untilBtn.classList.remove('active');
      if (fromBtn) fromBtn.classList.add('active');
    }

    this.updateTaskModalCalcPreview();
    this.openModal('modal-edit-task');
    setTimeout(() => {
      const nameInput = document.getElementById('modal-task-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 40);
  },

  updateTaskModalCalcPreview() {
    const hours = parseInt(document.getElementById('modal-task-hours')?.value, 10) || 0;
    const minutes = parseInt(document.getElementById('modal-task-minutes')?.value, 10) || 0;
    const totalMin = (hours * 60) + minutes;
    const prevEl = document.getElementById('modal-task-calc-preview');
    if (!prevEl) return;

    if (totalMin <= 0) {
      prevEl.innerHTML = `⏱️ <span>Время не задано (0 мин)</span>`;
      return;
    }

    const calcMode = this.timeLogCalcMode || 'until_now';
    const now = new Date();
    const formatHM = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    if (calcMode === 'from_now') {
      const start = now;
      const end = new Date(now.getTime() + totalMin * 60000);
      prevEl.innerHTML = `🚀 <b>От текущего (вперед):</b>&nbsp; ${formatHM(start)} ➔ ${formatHM(end)} &nbsp;(${TimerEngine.formatTimeReadable(totalMin * 60)})`;
    } else {
      const end = now;
      const start = new Date(now.getTime() - totalMin * 60000);
      prevEl.innerHTML = `🏁 <b>До текущего (назад):</b>&nbsp; ${formatHM(start)} ➔ ${formatHM(end)} &nbsp;(${TimerEngine.formatTimeReadable(totalMin * 60)})`;
    }
  },

  setTaskEditCalcMode(mode) {
    this.timeLogCalcMode = mode || 'until_now';
    localStorage.setItem('planer_time_log_calc_mode', this.timeLogCalcMode);
    const untilBtn = document.getElementById('btn-task-calc-mode-until-now');
    const fromBtn = document.getElementById('btn-task-calc-mode-from-now');
    const modeInput = document.getElementById('modal-task-calc-mode');
    if (modeInput) modeInput.value = this.timeLogCalcMode;

    if (this.timeLogCalcMode === 'until_now') {
      if (untilBtn) untilBtn.classList.add('active');
      if (fromBtn) fromBtn.classList.remove('active');
    } else {
      if (untilBtn) untilBtn.classList.remove('active');
      if (fromBtn) fromBtn.classList.add('active');
    }
    this.updateTaskModalCalcPreview();
  },

  openTimeLogFromEditModal() {
    const taskId = document.getElementById('modal-task-edit-id')?.value;
    if (taskId) {
      this.saveTaskModal();
      setTimeout(() => {
        this.openManualTimeLogForTask(taskId);
      }, 50);
    }
  },

  onModalTimeInputChange() {
    const hours = parseInt(document.getElementById('modal-task-hours')?.value, 10) || 0;
    const minutes = parseInt(document.getElementById('modal-task-minutes')?.value, 10) || 0;
    const totalSec = (hours * 3600) + (minutes * 60);
    const display = document.getElementById('modal-task-time-display');
    if (display) display.textContent = TimerEngine.formatTimeReadable(totalSec);
    this.updateTaskModalCalcPreview();
  },

  addMinutesToModalTask(minsToAdd) {
    const hoursInput = document.getElementById('modal-task-hours');
    const minsInput = document.getElementById('modal-task-minutes');
    const curHours = parseInt(hoursInput?.value, 10) || 0;
    const curMins = parseInt(minsInput?.value, 10) || 0;
    const totalMins = curHours * 60 + curMins + minsToAdd;
    const newHours = Math.floor(Math.max(0, totalMins) / 60);
    const newMins = Math.max(0, totalMins) % 60;
    if (hoursInput) hoursInput.value = newHours > 0 ? newHours : '';
    if (minsInput) minsInput.value = newMins > 0 ? newMins : '';
    this.onModalTimeInputChange();
  },

  resetModalTaskTime() {
    const hoursInput = document.getElementById('modal-task-hours');
    const minsInput = document.getElementById('modal-task-minutes');
    if (hoursInput) hoursInput.value = '';
    if (minsInput) minsInput.value = '';
    this.onModalTimeInputChange();
  },

  renderModalSubtasksList(subtasks) {
    const container = document.getElementById('modal-subtasks-list');
    if (!container) return;

    if (subtasks.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 12.5px; padding: 4px 0;">Подпунктов пока нет. Нажмите «+ Добавить пункт».</div>`;
      return;
    }

    let html = '';
    subtasks.forEach((sub, index) => {
      const mins = Math.round((sub.timeSpentSeconds || 0) / 60);
      html += `
        <div class="modal-subtask-item" id="modal-subtask-row-${index}" data-sub-id="${sub.id}">
          <input type="checkbox" class="subtask-checkbox modal-sub-check" ${sub.completed ? 'checked' : ''}>
          <input type="text" class="modal-input modal-sub-text" value="${this.escapeHtml(sub.text)}" placeholder="Название подпункта...">
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;" title="Затраченное время на этот подпункт в минутах">
            <span style="font-size: 11px; color: var(--text-muted);">⏱</span>
            <input type="number" min="0" class="modal-input modal-sub-mins" value="${mins || ''}" placeholder="мин" style="width: 55px; padding: 4px 6px; font-size: 12px; text-align: center;">
          </div>
          <button type="button" class="btn-icon btn-delete" onclick="this.closest('.modal-subtask-item').remove()" title="Удалить подпункт">🗑</button>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  addSubtaskInModal() {
    const container = document.getElementById('modal-subtasks-list');
    if (!container) return;

    if (container.children.length === 1 && !container.querySelector('.modal-subtask-item')) {
      container.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = 'modal-subtask-item';
    div.innerHTML = `
      <input type="checkbox" class="subtask-checkbox modal-sub-check">
      <input type="text" class="modal-input modal-sub-text" placeholder="Название подпункта...">
      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;" title="Затраченное время на этот подпункт в минутах">
        <span style="font-size: 11px; color: var(--text-muted);">⏱</span>
        <input type="number" min="0" class="modal-input modal-sub-mins" placeholder="мин" style="width: 55px; padding: 4px 6px; font-size: 12px; text-align: center;">
      </div>
      <button type="button" class="btn-icon btn-delete" onclick="this.closest('.modal-subtask-item').remove()" title="Удалить подпункт">🗑</button>
    `;
    container.appendChild(div);

    const input = div.querySelector('.modal-sub-text');
    if (input) input.focus();
  },

  clearTaskModalReminder() {
    document.getElementById('modal-task-date').value = '';
    const hasReminderCheck = document.getElementById('modal-task-has-reminder');
    if (hasReminderCheck) hasReminderCheck.checked = false;
    const timeBox = document.getElementById('modal-task-time-box');
    if (timeBox) timeBox.style.display = 'none';
    const advSelect = document.getElementById('modal-task-reminder-advance');
    if (advSelect) advSelect.value = '0';
    const advWrap = document.getElementById('modal-task-advance-also-wrap');
    if (advWrap) advWrap.style.display = 'none';
  },

  saveTaskModal() {
    const taskId = document.getElementById('modal-task-edit-id').value;
    const task = this.data.tasks.find(t => t.id === taskId) || 
                 (this.data.completedTasks || []).find(t => t.id === taskId);
    if (!task) return;

    const title = document.getElementById('modal-task-name').value.trim();
    if (!title) return;

    task.title = title;
    task.description = document.getElementById('modal-task-desc').value.trim();
    task.color = document.getElementById('modal-task-color').value || '';

    const subtaskRows = document.querySelectorAll('#modal-subtasks-list .modal-subtask-item');
    const newSubtasks = [];
    subtaskRows.forEach(row => {
      const check = row.querySelector('.modal-sub-check');
      const textInput = row.querySelector('.modal-sub-text');
      const minsInput = row.querySelector('.modal-sub-mins');
      const text = textInput ? textInput.value.trim() : '';
      const existingId = row.getAttribute('data-sub-id');
      const subMins = parseInt(minsInput?.value, 10) || 0;
      if (text) {
        newSubtasks.push({
          id: existingId || ('sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
          text: text,
          completed: check ? check.checked : false,
          timeSpentSeconds: subMins * 60
        });
      }
    });
    task.subtasks = newSubtasks;

    const projSelect = document.getElementById('modal-task-project-select');
    if (projSelect && projSelect.value && projSelect.value.includes(':::')) {
      const [secId, projId] = projSelect.value.split(':::');
      const folderInfo = this.findFolderInfo(projId);
      if (folderInfo) {
        task.sectionId = folderInfo.section.id;
        task.projectId = folderInfo.folder.id;
      } else {
        task.sectionId = secId;
        task.projectId = projId;
      }
    }

    const dateVal = document.getElementById('modal-task-date').value;
    const hasReminder = document.getElementById('modal-task-has-reminder')?.checked;
    const timeVal = document.getElementById('modal-task-time')?.value || '12:00';
    const advanceVal = parseInt(document.getElementById('modal-task-reminder-advance')?.value, 10) || 0;
    const alsoExact = document.getElementById('modal-task-advance-also-exact')?.checked !== false;

    if (dateVal) {
      task.dueDate = dateVal;
      if (hasReminder) {
        task.reminderTime = new Date(`${dateVal}T${timeVal}:00`).toISOString();
        task.reminderAdvance = advanceVal;
        task.reminderAdvanceAlsoExact = alsoExact;
        task.reminderNotified = false;
        task.advanceNotified = false;
      } else {
        task.reminderTime = null;
        task.reminderAdvance = 0;
        task.advanceNotified = false;
      }
    } else {
      task.dueDate = null;
      task.reminderTime = null;
      task.reminderAdvance = 0;
      task.advanceNotified = false;
    }

    const repeatVal = document.getElementById('modal-task-repeat')?.value || 'none';
    task.repeat = repeatVal;

    // Сохранение вложений
    task.attachments = Array.isArray(this.tempTaskAttachments) ? this.tempTaskAttachments : [];

    // Сохранение и корректировка потраченного времени
    const hours = parseInt(document.getElementById('modal-task-hours')?.value, 10) || 0;
    const minutes = parseInt(document.getElementById('modal-task-minutes')?.value, 10) || 0;
    let newTotalSec = (hours * 3600) + (minutes * 60);

    // Если время на задаче не указано явно, но указано на подпунктах — суммируем
    if (newTotalSec === 0 && newSubtasks.length > 0) {
      const sumSub = newSubtasks.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
      if (sumSub > 0) {
        newTotalSec = sumSub;
      }
    }

    task.timeSpentSeconds = newTotalSec;

    if (TimerEngine.timers.has(task.id)) {
      const t = TimerEngine.timers.get(task.id);
      t.accumulatedSeconds = newTotalSec;
      if (t.isRunning) {
        t.lastStartedAt = Date.now();
      }
    }

    if (newTotalSec > 0) {
      if (!Array.isArray(this.data.timeLogs)) this.data.timeLogs = [];
      const taskLogs = this.data.timeLogs.filter(l => l.type === 'work' && l.taskId === task.id);
      const totalLogged = taskLogs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
      if (totalLogged < newTotalSec) {
        const deltaSec = newTotalSec - totalLogged;
        const todayStr = this.getLocalDateStr();
        const calcMode = document.getElementById('modal-task-calc-mode')?.value || this.timeLogCalcMode || 'until_now';
        const now = new Date();
        const todayLog = taskLogs.find(l => l.dateStr === todayStr || (l.startedAt && this.getLocalDateStr(new Date(l.startedAt)) === todayStr));
        if (todayLog) {
          todayLog.durationSeconds = (todayLog.durationSeconds || 0) + deltaSec;
          if (calcMode === 'until_now') {
            todayLog.endedAt = now.toISOString();
            todayLog.startedAt = new Date(now.getTime() - todayLog.durationSeconds * 1000).toISOString();
          } else {
            todayLog.startedAt = now.toISOString();
            todayLog.endedAt = new Date(now.getTime() + todayLog.durationSeconds * 1000).toISOString();
          }
        } else {
          let startedAt, endedAt;
          if (calcMode === 'until_now') {
            endedAt = now;
            startedAt = new Date(now.getTime() - deltaSec * 1000);
          } else {
            startedAt = now;
            endedAt = new Date(now.getTime() + deltaSec * 1000);
          }
          this.data.timeLogs.push({
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            type: 'work',
            taskId: task.id,
            taskTitle: task.title,
            sectionId: task.sectionId,
            projectId: task.projectId,
            color: task.color || '',
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            durationSeconds: deltaSec,
            dateStr: todayStr,
            note: ''
          });
        }
      } else if (totalLogged > newTotalSec) {
        const deltaSec = totalLogged - newTotalSec;
        const lastLog = taskLogs[taskLogs.length - 1];
        if (lastLog) {
          const newDur = Math.max(0, (lastLog.durationSeconds || 0) - deltaSec);
          lastLog.durationSeconds = newDur;
          lastLog.endedAt = new Date(new Date(lastLog.startedAt).getTime() + newDur * 1000).toISOString();
        }
      }
    }

    task.updatedAt = new Date().toISOString();
    this.saveData();
    this.renderCurrentView();
    this.renderSidebar();
    this.updateBadges();
    if (this.currentView === 'archive') {
      this.renderArchive();
    }
    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
    this.closeModal('modal-edit-task');
  },

  deleteTaskFromModal() {
    const taskId = document.getElementById('modal-task-edit-id').value;
    if (!taskId) return;

    if (confirm('Удалить эту задачу?')) {
      TimerEngine.stop(taskId);
      this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
      this.data.completedTasks = (this.data.completedTasks || []).filter(t => t.id !== taskId);
      this.saveData();
      this.renderCurrentView();
      this.renderSidebar();
      this.updateBadges();
      this.renderFloatingTimerDock();
      this.closeModal('modal-edit-task');
    }
  },

  // =========================================================================
  // Drag and Drop
  // =========================================================================
  onDragStart(e, taskId) {
    this.draggedTaskId = taskId;
    const row = document.getElementById(`task-row-${taskId}`);
    if (row) row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  },

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetItem = e.currentTarget.closest('.task-item');
    if (targetItem && targetItem.id !== `task-row-${this.draggedTaskId}`) {
      targetItem.classList.add('drag-over');
    }
  },

  onDragLeave(e) {
    const targetItem = e.currentTarget.closest('.task-item');
    if (targetItem) {
      targetItem.classList.remove('drag-over');
    }
  },

  onDrop(e, targetTaskId) {
    e.preventDefault();
    document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));

    if (!this.draggedTaskId || this.draggedTaskId === targetTaskId) return;

    const fromIndex = this.data.tasks.findIndex(t => t.id === this.draggedTaskId);
    const toIndex = this.data.tasks.findIndex(t => t.id === targetTaskId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = this.data.tasks.splice(fromIndex, 1);
      this.data.tasks.splice(toIndex, 0, moved);

      this.data.tasks.forEach((t, i) => { t.order = i + 1; });

      this.saveData();
      this.renderCurrentView();
    }
  },

  onDragEnd(e) {
    document.querySelectorAll('.task-item').forEach(el => {
      el.classList.remove('dragging');
      el.classList.remove('drag-over');
    });
    this.draggedTaskId = null;
  },

  // =========================================================================
  // Создание новой задачи
  // =========================================================================
  addNewTask() {
    const input = document.getElementById('new-task-title');
    if (!input) return;

    const title = input.value.trim();
    if (!title) {
      input.focus();
      input.classList.add('input-attention');
      input.placeholder = '⚠️ Напишите сюда название задачи...';
      setTimeout(() => {
        input.classList.remove('input-attention');
        input.placeholder = '+ Добавить задачу... (Нажмите Enter)';
      }, 2500);
      return;
    }

    let sectionId = 'work';
    let projectId = 'proj-work-general';

    const select = document.getElementById('new-task-project-select');

    if (typeof this.currentView === 'object' && this.currentView.sectionId && this.currentView.projectId) {
      sectionId = this.currentView.sectionId;
      projectId = this.currentView.projectId;
      if (select && select.value && select.value.includes(':::')) {
        const parts = select.value.split(':::');
        sectionId = parts[0];
        projectId = parts[1];
      }
    } else if (typeof this.currentView === 'object' && this.currentView.sectionId && !this.currentView.projectId) {
      sectionId = this.currentView.sectionId;
      if (select && select.value && select.value.startsWith(`${sectionId}:::`)) {
        projectId = select.value.split(':::')[1];
      } else {
        const sec = this.data.sections.find(s => s.id === sectionId);
        projectId = sec?.projects?.[0]?.id || 'proj-work-general';
      }
    } else if (this.currentView === 'today') {
      if (this.todayFilterProject && this.todayFilterProject !== 'all') {
        const fInfo = this.findFolderInfo(this.todayFilterProject);
        if (fInfo) {
          sectionId = fInfo.section.id;
          projectId = fInfo.folder.id;
        }
      } else if (this.todayFilterSection && this.todayFilterSection !== 'all') {
        const sec = this.data.sections.find(s => s.id === this.todayFilterSection);
        if (sec && sec.projects?.length > 0) {
          sectionId = sec.id;
          projectId = sec.projects[0].id;
        }
      } else if (select && select.value && select.value.includes(':::')) {
        const parts = select.value.split(':::');
        sectionId = parts[0];
        projectId = parts[1];
      }
    } else if (select && select.value && select.value.includes(':::')) {
      const parts = select.value.split(':::');
      sectionId = parts[0];
      projectId = parts[1];
    } else if (this.data.sections.length > 0 && this.data.sections[0].projects?.length > 0) {
      sectionId = this.data.sections[0].id;
      projectId = this.data.sections[0].projects[0].id;
    }

    // 2. Строгая проверка целостности: привязываем sectionId к реальному родительскому разделу папки
    const folderInfo = this.findFolderInfo(projectId);
    if (folderInfo) {
      sectionId = folderInfo.section.id;
      projectId = folderInfo.folder.id;
    }

    let dueDate = this.newTaskDueDate || null;
    let reminderIso = this.newTaskReminderTime || null;

    if (!dueDate && !reminderIso && this.currentView === 'today') {
      dueDate = this.getLocalDateStr();
    }

    const repeatVal = document.getElementById('new-task-repeat')?.value || 'none';
    const maxOrder = this.data.tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
    const isDefaultCollapsed = (this.data.settings.defaultSubtasksExpanded || 'collapsed') === 'collapsed';

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title,
      description: '',
      subtasks: [],
      subtasksCollapsed: isDefaultCollapsed,
      descriptionCollapsed: isDefaultCollapsed,
      sectionId: sectionId,
      projectId: projectId,
      color: this.newTaskColor || '',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate,
      reminderTime: reminderIso,
      reminderAdvance: this.newTaskReminderAdvance || 0,
      reminderAdvanceAlsoExact: true,
      reminderNotified: false,
      advanceNotified: false,
      repeat: repeatVal,
      timeSpentSeconds: 0,
      order: maxOrder + 1
    };

    this.data.tasks.push(newTask);
    this.saveData();

    input.value = '';
    this.clearNewTaskReminder();
    this.selectNewTaskColor('');
    this.renderCurrentView();
    this.renderSidebar();
    this.updateBadges();
    input.focus();
  },

  toggleNewTaskReminderPopover(e) {
    e.stopPropagation();
    const popover = document.getElementById('reminder-popover');
    popover.classList.toggle('show');
    
    const dateInput = document.getElementById('new-task-date');
    if (!dateInput.value) {
      dateInput.value = this.getLocalDateStr();
    }
  },

  setNewTaskDateShortcut(type) {
    const dateInput = document.getElementById('new-task-date');
    if (!dateInput) return;
    const now = new Date();
    if (type === 'today') {
      dateInput.value = this.getLocalDateStr(now);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
      dateInput.value = this.getLocalDateStr(tomorrow);
    } else if (type === 'next_week') {
      const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12, 0, 0);
      dateInput.value = this.getLocalDateStr(nextWeek);
    }
  },

  applyNewTaskReminder() {
    const dateInput = document.getElementById('new-task-date');
    const enableTimeCheck = document.getElementById('new-task-enable-time');
    const timeInput = document.getElementById('new-task-time');
    const repeatSelect = document.getElementById('new-task-repeat');
    const btn = document.getElementById('new-task-reminder-btn');
    const label = document.getElementById('reminder-btn-label');
    
    if (dateInput && dateInput.value) {
      this.newTaskDueDate = dateInput.value;
      const todayStr = this.getLocalDateStr();
      const isToday = dateInput.value === todayStr;
      const d = this.parseLocalDate(dateInput.value);
      const dateDisp = isToday ? 'Сегодня' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const repeatCode = repeatSelect?.value || 'none';
      const repeatText = repeatCode !== 'none' ? ` 🔁` : '';

      if (enableTimeCheck && enableTimeCheck.checked) {
        const timeVal = timeInput?.value || '12:00';
        const advVal = parseInt(document.getElementById('new-task-reminder-advance')?.value, 10) || 0;
        this.newTaskReminderTime = new Date(`${dateInput.value}T${timeVal}:00`).toISOString();
        this.newTaskReminderAdvance = advVal;
        const advShort = advVal > 0 ? ` (${this.formatAdvanceMinutesShort(advVal)})` : '';
        if (label) label.textContent = `📅 ${dateDisp} 🔔 ${timeVal}${advShort}${repeatText}`;
      } else {
        this.newTaskReminderTime = null;
        this.newTaskReminderAdvance = 0;
        if (label) label.textContent = `📅 ${dateDisp}${repeatText}`;
      }
      if (btn) btn.classList.add('has-reminder');
    }
    document.getElementById('reminder-popover').classList.remove('show');
  },

  clearNewTaskReminder() {
    this.newTaskDueDate = null;
    this.newTaskReminderTime = null;
    this.newTaskReminderAdvance = 0;
    const dateInput = document.getElementById('new-task-date');
    const enableTimeCheck = document.getElementById('new-task-enable-time');
    const timeBox = document.getElementById('new-task-time-box');
    const advSelect = document.getElementById('new-task-reminder-advance');
    const repeatSelect = document.getElementById('new-task-repeat');
    const btn = document.getElementById('new-task-reminder-btn');
    const label = document.getElementById('reminder-btn-label');

    if (dateInput) dateInput.value = '';
    if (enableTimeCheck) enableTimeCheck.checked = false;
    if (timeBox) timeBox.style.display = 'none';
    if (advSelect) advSelect.value = '0';
    if (repeatSelect) repeatSelect.value = 'none';
    if (btn) btn.classList.remove('has-reminder');
    if (label) label.textContent = '📅 Дата';
    document.getElementById('reminder-popover').classList.remove('show');
  },

  // Вычисление следующей даты для повторяющейся задачи
  calculateNextDueDate(currentDateStr, repeat) {
    const cur = this.parseLocalDate(currentDateStr || this.getLocalDateStr());
    let nextDate = new Date(cur.getTime());

    if (repeat === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (repeat === 'weekdays') {
      const dayOfWeek = nextDate.getDay(); // 0: вс, 5: пт, 6: сб
      if (dayOfWeek === 5) nextDate.setDate(nextDate.getDate() + 3);
      else if (dayOfWeek === 6) nextDate.setDate(nextDate.getDate() + 2);
      else nextDate.setDate(nextDate.getDate() + 1);
    } else if (repeat === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (repeat === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (repeat === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      return null;
    }

    return this.getLocalDateStr(nextDate);
  },

  // =========================================================================
  // Выполнение, Дублирование и Восстановление задач
  // =========================================================================
  completeTask(taskId) {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.data.tasks[taskIndex];

    let finalTimeSpent = task.timeSpentSeconds || 0;
    if (TimerEngine.timers.has(taskId)) {
      finalTimeSpent = TimerEngine.stop(taskId);
    }

    this.playChimeSound();

    const completedTask = {
      ...task,
      completed: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeSpentSeconds: finalTimeSpent
    };

    // Если у задачи было указано время (или таймер), но в timeLogs не было логов (или меньше)
    if (finalTimeSpent > 0) {
      if (!Array.isArray(this.data.timeLogs)) this.data.timeLogs = [];
      const loggedSec = this.data.timeLogs
        .filter(l => l.type === 'work' && l.taskId === task.id)
        .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
      if (loggedSec < finalTimeSpent) {
        const deltaSec = finalTimeSpent - loggedSec;
        const now = new Date();
        const startedAt = new Date(now.getTime() - deltaSec * 1000);
        this.data.timeLogs.push({
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'work',
          taskId: task.id,
          taskTitle: task.title,
          sectionId: task.sectionId,
          projectId: task.projectId,
          color: task.color || '',
          startedAt: startedAt.toISOString(),
          endedAt: now.toISOString(),
          durationSeconds: deltaSec,
          dateStr: this.getLocalDateStr(now),
          note: ''
        });
      }
    }

    if (!Array.isArray(this.data.completedTasks)) {
      this.data.completedTasks = [];
    }

    // Если задача регулярная (повторяющаяся) — создаем новую активную задачу на следующий цикл
    if (task.repeat && task.repeat !== 'none') {
      const curDueDate = task.dueDate || this.getLocalDateStr();
      const nextDueDate = this.calculateNextDueDate(curDueDate, task.repeat);

      let nextReminderTime = null;
      if (task.reminderTime && nextDueDate) {
        const origReminder = new Date(task.reminderTime);
        const hours = String(origReminder.getHours()).padStart(2, '0');
        const mins = String(origReminder.getMinutes()).padStart(2, '0');
        nextReminderTime = new Date(`${nextDueDate}T${hours}:${mins}:00`).toISOString();
      }

      const nextActiveTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: task.title,
        description: task.description || '',
        subtasks: (task.subtasks || []).map(s => ({
          id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          text: s.text,
          completed: false
        })),
        subtasksCollapsed: task.subtasksCollapsed !== undefined ? task.subtasksCollapsed : true,
        descriptionCollapsed: task.descriptionCollapsed !== undefined ? task.descriptionCollapsed : true,
        attachments: (task.attachments || []).map(a => ({ ...a })),
        noteHtml: task.noteHtml || '',
        noteText: task.noteText || '',
        sectionId: task.sectionId,
        projectId: task.projectId,
        color: task.color || '',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: nextDueDate,
        reminderTime: nextReminderTime,
        reminderAdvance: task.reminderAdvance || 0,
        reminderAdvanceAlsoExact: task.reminderAdvanceAlsoExact !== false,
        reminderNotified: false,
        advanceNotified: false,
        repeat: task.repeat,
        timeSpentSeconds: 0,
        order: task.order || 0
      };

      this.data.tasks.push(nextActiveTask);
    }

    this.data.tasks.splice(taskIndex, 1);
    this.data.completedTasks.unshift(completedTask);

    this.saveData();
    this.renderCurrentView();
    this.renderSidebar();
    this.renderFloatingTimerDock();
    this.updateBadges();
    if (this.currentView === 'archive') {
      this.renderArchive();
    }
    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
  },

  duplicateTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    const maxOrder = this.data.tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const duplicated = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: task.title,
      description: task.description || '',
      subtasks: (task.subtasks || []).map(s => ({ ...s, id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
      subtasksCollapsed: task.subtasksCollapsed !== undefined ? task.subtasksCollapsed : true,
      descriptionCollapsed: task.descriptionCollapsed !== undefined ? task.descriptionCollapsed : true,
      attachments: (task.attachments || []).map(a => ({ ...a })),
      sectionId: task.sectionId,
      projectId: task.projectId,
      color: task.color || '',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: task.dueDate || null,
      reminderTime: task.reminderTime || null,
      reminderAdvance: task.reminderAdvance || 0,
      reminderAdvanceAlsoExact: task.reminderAdvanceAlsoExact !== false,
      reminderNotified: false,
      advanceNotified: false,
      repeat: task.repeat || 'none',
      timeSpentSeconds: 0,
      order: maxOrder + 1
    };

    const currentIndex = this.data.tasks.findIndex(t => t.id === taskId);
    if (currentIndex !== -1) {
      this.data.tasks.splice(currentIndex + 1, 0, duplicated);
    } else {
      this.data.tasks.push(duplicated);
    }

    this.data.tasks.forEach((t, i) => { t.order = i + 1; });

    this.saveData();
    this.renderCurrentView();
    this.renderSidebar();
    this.updateBadges();
  },

  copyCompletedTaskToActive(taskId) {
    const task = this.data.completedTasks.find(t => t.id === taskId);
    if (!task) return;

    const maxOrder = this.data.tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const copied = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: task.title,
      description: task.description || '',
      subtasks: (task.subtasks || []).map(s => ({ ...s, id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), completed: false })),
      subtasksCollapsed: task.subtasksCollapsed !== undefined ? task.subtasksCollapsed : true,
      descriptionCollapsed: task.descriptionCollapsed !== undefined ? task.descriptionCollapsed : true,
      attachments: (task.attachments || []).map(a => ({ ...a })),
      noteHtml: task.noteHtml || '',
      noteText: task.noteText || '',
      sectionId: task.sectionId,
      projectId: task.projectId,
      color: task.color || '',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      reminderTime: null,
      reminderAdvance: 0,
      reminderAdvanceAlsoExact: true,
      reminderNotified: false,
      advanceNotified: false,
      timeSpentSeconds: 0,
      order: maxOrder + 1
    };

    this.data.tasks.push(copied);
    this.saveData();
    this.renderSidebar();
    this.updateBadges();
    
    alert(`✓ Задача "${task.title}" успешно скопирована в активные задачи!`);
  },

  restoreTask(taskId) {
    const index = this.data.completedTasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    const task = this.data.completedTasks[index];
    const restored = {
      ...task,
      completed: false,
      completedAt: null,
      updatedAt: new Date().toISOString(),
      order: this.data.tasks.length + 1
    };

    this.data.completedTasks.splice(index, 1);
    this.data.tasks.push(restored);

    this.saveData();
    this.renderArchive();
    this.renderSidebar();
  },

  deleteTask(taskId) {
    if (confirm('Удалить эту задачу?')) {
      TimerEngine.stop(taskId);
      if (window.SyncEngine) SyncEngine.recordTombstone(taskId, 'task');
      this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
      this.saveData();
      this.renderCurrentView();
      this.renderSidebar();
      this.updateBadges();
      this.renderFloatingTimerDock();
    }
  },

  deleteCompletedTask(taskId) {
    if (confirm('Удалить эту запись из архива навсегда?')) {
      if (window.SyncEngine) SyncEngine.recordTombstone(taskId, 'task');
      this.data.completedTasks = this.data.completedTasks.filter(t => t.id !== taskId);
      this.saveData();
      this.renderArchive();
      this.renderSidebar();
      this.updateBadges();
    }
  },

  // =========================================================================
  // Управление таймером задачи и подпунктов
  // =========================================================================
  toggleTaskTimer(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    TimerEngine.toggle(taskId, task.timeSpentSeconds || 0);
    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  toggleSubtaskTimer(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = (task.subtasks || []).find(s => s.id === subtaskId);
    if (!subtask) return;

    const timerKey = `${taskId}:::sub:::${subtaskId}`;
    TimerEngine.toggle(timerKey, subtask.timeSpentSeconds || 0);
    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  stopSubtaskTimerAndSave(taskId, subtaskId) {
    const timerKey = `${taskId}:::sub:::${subtaskId}`;
    const finalSeconds = TimerEngine.stop(timerKey);
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      const subtask = (task.subtasks || []).find(s => s.id === subtaskId);
      if (subtask) {
        subtask.timeSpentSeconds = finalSeconds;
      }
      this.saveData();
    }
    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  async promptEditSubtaskTime(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId) || this.data.completedTasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = (task.subtasks || []).find(s => s.id === subtaskId);
    if (!subtask) return;

    const currentMins = Math.round((subtask.timeSpentSeconds || 0) / 60);
    const input = await this.showPrompt(`⏱️ Укажите время на подпункт «${subtask.text}» (в минутах):`, currentMins ? String(currentMins) : '10');
    if (input === null) return;
    const newMins = parseInt(input, 10);
    if (isNaN(newMins) || newMins < 0) {
      alert('Пожалуйста, введите положительное число минут.');
      return;
    }

    const newSec = newMins * 60;
    const oldSec = subtask.timeSpentSeconds || 0;
    subtask.timeSpentSeconds = newSec;

    // Синхронизируем с общим временем задачи
    const deltaSec = newSec - oldSec;
    task.timeSpentSeconds = Math.max(0, (task.timeSpentSeconds || 0) + deltaSec);

    // Добавляем запись в журнал времени
    if (deltaSec > 0) {
      if (!Array.isArray(this.data.timeLogs)) this.data.timeLogs = [];
      const now = new Date();
      const startedAt = new Date(now.getTime() - deltaSec * 1000);
      this.data.timeLogs.push({
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: 'work',
        taskId: task.id,
        subtaskId: subtask.id,
        subtaskTitle: subtask.text,
        taskTitle: task.title,
        sectionId: task.sectionId,
        projectId: task.projectId,
        color: task.color || '',
        startedAt: startedAt.toISOString(),
        endedAt: now.toISOString(),
        durationSeconds: deltaSec,
        dateStr: this.getLocalDateStr(now),
        note: ''
      });
    }

    task.updatedAt = new Date().toISOString();
    this.saveData();
    this.renderCurrentView();
    this.renderSidebar();
    this.updateBadges();
    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
  },

  updateTimerDisplays() {
    TimerEngine.getActiveTimerIds().forEach(key => {
      const elapsed = TimerEngine.getElapsedSeconds(key);
      const isRunning = TimerEngine.isRunning(key);

      if (key.includes(':::sub:::')) {
        const [taskId, subId] = key.split(':::sub:::');
        const subBtn = document.getElementById(`timer-btn-sub-${taskId}-${subId}`);
        const subText = document.getElementById(`timer-text-sub-${taskId}-${subId}`);
        if (subBtn && subText) {
          subText.textContent = TimerEngine.formatTimeDigits(elapsed);
          if (isRunning) {
            subBtn.classList.add('running');
            subBtn.querySelector('span:first-child').textContent = '⏸';
          } else {
            subBtn.classList.remove('running');
            subBtn.querySelector('span:first-child').textContent = '▶';
          }
        }
      } else {
        const btn = document.getElementById(`timer-btn-${key}`);
        const text = document.getElementById(`timer-text-${key}`);
        if (btn && text) {
          text.textContent = TimerEngine.formatTimeDigits(elapsed);
          if (isRunning) {
            btn.classList.add('running');
            btn.querySelector('span:first-child').textContent = '⏸';
          } else {
            btn.classList.remove('running');
            btn.querySelector('span:first-child').textContent = '▶';
          }
        }
      }
    });
  },

  // =========================================================================
  // Плавающий док таймеров
  // =========================================================================
  lastDockSignature: '',

  renderFloatingTimerDock() {
    const dock = document.getElementById('floating-timer-dock');
    const itemsContainer = document.getElementById('timer-dock-items');
    const countBadge = document.getElementById('dock-active-count');
    if (!dock || !itemsContainer) return;

    const activeTimerIds = TimerEngine.getActiveTimerIds();
    const isBreak = TimerEngine.isBreakRunning();

    // Обновляем текст кнопки перерыва в шапке статистики
    const statsBreakText = document.getElementById('stats-btn-break-text');
    if (statsBreakText) {
      statsBreakText.textContent = isBreak ? 'Завершить перерыв' : 'Начать перерыв';
    }

    if (activeTimerIds.length === 0 && !isBreak) {
      dock.style.display = 'none';
      this.lastDockSignature = '';
      return;
    }

    dock.style.display = 'flex';
    countBadge.textContent = isBreak 
      ? `☕ Отдых (${TimerEngine.formatTimeDigits(TimerEngine.getBreakElapsedSeconds())})` 
      : `⏱ Таймер (${activeTimerIds.length})`;

    if (this.isTimerDockCollapsed) {
      itemsContainer.style.display = 'none';
      const toggleBtn = document.getElementById('btn-toggle-dock');
      if (toggleBtn) toggleBtn.textContent = '▴';
      return;
    }

    itemsContainer.style.display = 'flex';
    const toggleBtn = document.getElementById('btn-toggle-dock');
    if (toggleBtn) toggleBtn.textContent = '▾';

    const breakInfo = TimerEngine.getBreakInfo();
    const currentSignature = [
      isBreak,
      breakInfo?.note || '',
      ...activeTimerIds.map(k => `${k}:${TimerEngine.isRunning(k)}`)
    ].join('|');

    // Если список таймеров и их состояния не изменились — обновляем только цифры времени без ререндера DOM
    if (this.lastDockSignature === currentSignature && itemsContainer.children.length > 0) {
      if (isBreak) {
        const breakEl = document.getElementById('dock-break-digits');
        if (breakEl) breakEl.textContent = TimerEngine.formatTimeDigits(TimerEngine.getBreakElapsedSeconds());
      }
      activeTimerIds.forEach(key => {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        const digitsEl = document.getElementById(`dock-digits-${safeKey}`);
        if (digitsEl) digitsEl.textContent = TimerEngine.formatTimeDigits(TimerEngine.getElapsedSeconds(key));
      });
      return;
    }

    this.lastDockSignature = currentSignature;
    let html = '';

    // Если активен перерыв — выводим карточку перерыва сверху
    if (isBreak) {
      const breakElapsed = TimerEngine.getBreakElapsedSeconds();
      const breakDigits = TimerEngine.formatTimeDigits(breakElapsed);
      const breakNote = breakInfo && breakInfo.note ? ` (${breakInfo.note})` : '';

      html += `
        <div class="dock-break-card">
          <div class="dock-break-info">
            <span class="dock-break-pulse"></span>
            <div>
              <div class="dock-break-title">☕ Перерыв / Отдых${this.escapeHtml(breakNote)}</div>
              <div class="dock-break-time" id="dock-break-digits">${breakDigits}</div>
            </div>
          </div>
          <button type="button" class="btn-dock-break-stop" onclick="App.stopBreak()" title="Завершить перерыв и зафиксировать время">
            ⏹ Завершить
          </button>
        </div>
      `;
    }

    activeTimerIds.forEach(key => {
      let task = null;
      let subtask = null;
      const isSub = key.includes(':::sub:::');
      let taskId = key;
      let subId = null;

      if (isSub) {
        const parts = key.split(':::sub:::');
        taskId = parts[0];
        subId = parts[1];
        task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
          subtask = (task.subtasks || []).find(s => s.id === subId);
        }
      } else {
        task = this.data.tasks.find(t => t.id === taskId);
      }

      if (!task) return;

      const elapsed = TimerEngine.getElapsedSeconds(key);
      const isRunning = TimerEngine.isRunning(key);
      const digits = TimerEngine.formatTimeDigits(elapsed);
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');

      let titleDisplay = task.title;
      let subBadge = '';
      if (subtask) {
        subBadge = `<div class="dock-subtask-title">🔹 <b>${this.escapeHtml(subtask.text)}</b></div>`;
      }

      html += `
        <div class="floating-timer-card" id="dock-card-${safeKey}">
          <div class="floating-timer-title" title="${this.escapeHtml(titleDisplay)}">
            ${this.escapeHtml(titleDisplay)}
            ${subBadge}
          </div>
          <div class="floating-timer-controls">
            <div class="floating-timer-digits" id="dock-digits-${safeKey}">${digits}</div>
            <div class="floating-timer-btns">
              <button class="btn-dock-action" onclick="${isSub ? `App.toggleSubtaskTimer('${taskId}', '${subId}')` : `App.toggleTaskTimer('${taskId}')`}" title="${isRunning ? 'Пауза' : 'Старт'}">
                ${isRunning ? '⏸ Пауза' : '▶ Старт'}
              </button>
              <button class="btn-dock-action" onclick="${isSub ? `App.stopSubtaskTimerAndSave('${taskId}', '${subId}')` : `App.stopTaskTimerAndSave('${taskId}')`}" title="Остановить таймер">
                ⏹ Стоп
              </button>
              <button class="btn-dock-action btn-dock-reset" onclick="${isSub ? `App.resetSubtaskTimer('${taskId}', '${subId}')` : `App.resetTaskTimer('${taskId}')`}" title="Сбросить накопленное время таймера в 00:00">
                ↺ Сброс
              </button>
              <button class="btn-dock-action btn-dock-done" onclick="${isSub ? `App.toggleSubtask('${taskId}', '${subId}')` : `App.completeTask('${taskId}')`}" title="${isSub ? 'Отметить подпункт' : 'Выполнить задачу'}">
                ✓ ${isSub ? 'Подпункт' : 'Готово'}
              </button>
            </div>
          </div>
        </div>
      `;
    });

    itemsContainer.innerHTML = html;
  },

  toggleTimerDockExpand() {
    this.isTimerDockCollapsed = !this.isTimerDockCollapsed;
    this.renderFloatingTimerDock();
  },

  stopTaskTimerAndSave(taskId) {
    const finalSeconds = TimerEngine.stop(taskId);
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.timeSpentSeconds = finalSeconds;
      this.saveData();
    }
    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  resetTaskTimer(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!confirm(`Сбросить накопленное время таймера для задачи «${task.title}» в 00:00?`)) {
      return;
    }

    if (TimerEngine.isRunning(taskId)) {
      TimerEngine.stop(taskId);
    }
    TimerEngine.activeTimers.delete(taskId);

    task.timeSpentSeconds = 0;

    if (Array.isArray(task.subtasks)) {
      task.subtasks.forEach(sub => {
        const subKey = `${task.id}:::sub:::${sub.id}`;
        if (TimerEngine.isRunning(subKey)) {
          TimerEngine.stop(subKey);
        }
        TimerEngine.activeTimers.delete(subKey);
        sub.timeSpentSeconds = 0;
      });
    }

    const todayStr = this.getLocalDateStr();
    if (Array.isArray(TimerEngine.todaySessions)) {
      TimerEngine.todaySessions = TimerEngine.todaySessions.filter(s => s.taskId !== taskId);
    }
    if (Array.isArray(this.data.timeLogs)) {
      this.data.timeLogs = this.data.timeLogs.filter(l => !(l.taskId === taskId && l.date === todayStr));
    }

    task.updatedAt = new Date().toISOString();
    this.saveData();

    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  resetSubtaskTimer(taskId, subId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const sub = task.subtasks.find(s => s.id === subId);
    if (!sub) return;

    const subKey = `${task.id}:::sub:::${sub.id}`;
    if (TimerEngine.isRunning(subKey)) {
      TimerEngine.stop(subKey);
    }
    TimerEngine.activeTimers.delete(subKey);
    sub.timeSpentSeconds = 0;

    task.updatedAt = new Date().toISOString();
    this.saveData();

    this.renderCurrentView();
    this.renderFloatingTimerDock();
  },

  resetModalTaskTime() {
    const hoursInput = document.getElementById('modal-task-hours');
    const minsInput = document.getElementById('modal-task-minutes');
    if (hoursInput) hoursInput.value = '0';
    if (minsInput) minsInput.value = '0';
    this.onModalTimeInputChange();
  },

  // =========================================================================
  // Управление перерывом (Break Timer)
  // =========================================================================
  toggleBreak(targetMinutes = null, note = '') {
    if (TimerEngine.isBreakRunning()) {
      this.stopBreak();
    } else {
      this.startBreak(targetMinutes, note);
    }
  },

  startBreak(targetMinutes = null, note = '') {
    TimerEngine.startBreak(targetMinutes, note);
    this.renderFloatingTimerDock();
    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
  },

  stopBreak() {
    TimerEngine.stopBreak();
    this.renderFloatingTimerDock();
    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
  },

  handleSessionCompleted(sessionData) {
    let rawTaskId = sessionData.taskId || null;
    let targetTaskId = rawTaskId;
    let targetSubtaskId = null;
    let subtaskTitle = '';

    if (rawTaskId && rawTaskId.includes(':::sub:::')) {
      const parts = rawTaskId.split(':::sub:::');
      targetTaskId = parts[0];
      targetSubtaskId = parts[1];
    }

    let taskTitle = sessionData.taskTitle || 'Сессия';
    let sectionId = null;
    let projectId = null;
    let color = '';

    if (sessionData.type === 'work' && targetTaskId) {
      const task = this.data.tasks.find(t => t.id === targetTaskId) ||
                   this.data.completedTasks.find(t => t.id === targetTaskId);
      if (task) {
        taskTitle = task.title;
        sectionId = task.sectionId;
        projectId = task.projectId;
        color = task.color || '';

        if (targetSubtaskId && Array.isArray(task.subtasks)) {
          const sub = task.subtasks.find(s => s.id === targetSubtaskId);
          if (sub) {
            subtaskTitle = sub.text;
            sub.timeSpentSeconds = (sub.timeSpentSeconds || 0) + sessionData.durationSeconds;
          }
        }
        // Общее время задачи увеличивается на длительность сессии
        task.timeSpentSeconds = (task.timeSpentSeconds || 0) + sessionData.durationSeconds;
        task.updatedAt = new Date().toISOString();
      }
    }

    const startDate = new Date(sessionData.startedAt);
    const dateStr = this.getLocalDateStr(startDate);

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      type: sessionData.type, // 'work' | 'break'
      taskId: targetTaskId,
      subtaskId: targetSubtaskId,
      subtaskTitle: subtaskTitle,
      taskTitle: taskTitle,
      sectionId: sectionId,
      projectId: projectId,
      color: color,
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt,
      durationSeconds: sessionData.durationSeconds,
      dateStr: dateStr,
      note: sessionData.note || ''
    };

    if (!Array.isArray(this.data.timeLogs)) {
      this.data.timeLogs = [];
    }

    this.data.timeLogs.push(logEntry);
    this.saveData();

    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
  },

  // =========================================================================
  // Аналитика и статистика времени (Stats View)
  // =========================================================================
  setStatsPeriod(period) {
    this.statsPeriod = period;
    this.statsDateFrom = null;
    this.statsDateTo = null;

    const fromInput = document.getElementById('stats-date-from');
    const toInput = document.getElementById('stats-date-to');
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';

    this.renderStatsView();
  },

  onStatsDateRangeChange() {
    const fromVal = document.getElementById('stats-date-from')?.value;
    const toVal = document.getElementById('stats-date-to')?.value;
    if (fromVal && !toVal) {
      const toInput = document.getElementById('stats-date-to');
      if (toInput) toInput.value = fromVal;
    }
  },

  applyStatsCustomRange() {
    let fromVal = document.getElementById('stats-date-from')?.value;
    let toVal = document.getElementById('stats-date-to')?.value;

    if (!fromVal && !toVal) {
      alert('Пожалуйста, выберите дату');
      return;
    }

    if (!fromVal) fromVal = toVal;
    if (!toVal) toVal = fromVal;

    if (fromVal > toVal) {
      const temp = fromVal;
      fromVal = toVal;
      toVal = temp;
      const fromInput = document.getElementById('stats-date-from');
      const toInput = document.getElementById('stats-date-to');
      if (fromInput) fromInput.value = fromVal;
      if (toInput) toInput.value = toVal;
    }

    this.statsPeriod = 'custom';
    this.statsDateFrom = fromVal;
    this.statsDateTo = toVal;

    this.renderStatsView();
  },

  applyStatsFilters() {
    const secFilter = document.getElementById('stats-section-filter');
    if (secFilter) {
      this.statsSectionFilter = secFilter.value;
    }
    this.renderStatsView();
  },

  updateLiveStatsKPI() {
    // Вспомогательный метод для обновления счетчиков KPI в реальном времени при тике
    let logs = this.data.timeLogs || [];
    const todayStr = this.getLocalDateStr();
    logs = logs.filter(l => l.dateStr === todayStr);

    let workSeconds = logs.filter(l => l.type === 'work').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
    let breakSeconds = logs.filter(l => l.type === 'break').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

    // Добавляем тикающее время прямо сейчас
    TimerEngine.getActiveTimerIds().forEach(taskId => {
      if (TimerEngine.isRunning(taskId)) {
        const t = TimerEngine.timers.get(taskId);
        if (t && t.sessionStartTimestamp) {
          const curSec = Math.floor((Date.now() - t.sessionStartTimestamp) / 1000);
          workSeconds += curSec;
        }
      }
    });

    if (TimerEngine.isBreakRunning()) {
      breakSeconds += TimerEngine.getBreakElapsedSeconds();
    }

    const totalSeconds = workSeconds + breakSeconds;

    const elWork = document.getElementById('kpi-work-time');
    const elBreak = document.getElementById('kpi-break-time');
    const elTotal = document.getElementById('kpi-total-activity');

    if (elWork) elWork.textContent = TimerEngine.formatTimeReadable(workSeconds);
    if (elBreak) elBreak.textContent = TimerEngine.formatTimeReadable(breakSeconds);
    if (elTotal) elTotal.textContent = TimerEngine.formatTimeReadable(totalSeconds);
  },

  renderStatsView() {
    let logs = this.data.timeLogs || [];
    const todayStr = this.getLocalDateStr();
    const period = this.statsPeriod || 'today';

    let targetDateStr = todayStr;
    let isSingleDay = false;

    if (period === 'today') {
      targetDateStr = todayStr;
      logs = logs.filter(l => l.dateStr === todayStr);
      isSingleDay = true;
    } else if (period === 'yesterday') {
      targetDateStr = this.getLocalDatePlusDays(-1);
      logs = logs.filter(l => l.dateStr === targetDateStr);
      isSingleDay = true;
    } else if (period === 'week') {
      const weekStartStr = this.getLocalDatePlusDays(-6);
      logs = logs.filter(l => l.dateStr >= weekStartStr && l.dateStr <= todayStr);
      isSingleDay = false;
    } else if (period === 'month') {
      const monthStartStr = this.getLocalDatePlusDays(-29);
      logs = logs.filter(l => l.dateStr >= monthStartStr && l.dateStr <= todayStr);
      isSingleDay = false;
    } else if (period === 'all') {
      isSingleDay = false;
    } else if (period === 'custom') {
      const fromStr = this.statsDateFrom || todayStr;
      const toStr = this.statsDateTo || fromStr;
      if (fromStr === toStr) {
        targetDateStr = fromStr;
        logs = logs.filter(l => l.dateStr === targetDateStr);
        isSingleDay = true;
      } else {
        logs = logs.filter(l => l.dateStr >= fromStr && l.dateStr <= toStr);
        isSingleDay = false;
      }
    }

    // Синхронизируем активный класс кнопок периода
    document.querySelectorAll('[data-stats-period]').forEach(b => {
      if (b.getAttribute('data-stats-period') === period && period !== 'custom') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const fromInput = document.getElementById('stats-date-from');
    const toInput = document.getElementById('stats-date-to');
    if (fromInput && this.statsDateFrom) fromInput.value = this.statsDateFrom;
    if (toInput && this.statsDateTo) toInput.value = this.statsDateTo;

    const secFilter = document.getElementById('stats-section-filter');
    if (secFilter && (secFilter.options?.length || secFilter.children?.length || 0) <= 1) {
      this.populateProjectSelects();
    }

    // Фильтр по разделам / проектам
    if (this.statsSectionFilter && this.statsSectionFilter !== 'all') {
      if (this.statsSectionFilter.startsWith('sec:')) {
        const secId = this.statsSectionFilter.replace('sec:', '');
        logs = logs.filter(l => l.sectionId === secId || l.type === 'break');
      } else if (this.statsSectionFilter.startsWith('proj:')) {
        const parts = this.statsSectionFilter.split(':');
        const projId = parts[2];
        logs = logs.filter(l => l.projectId === projId || l.type === 'break');
      }
    }

    // Подсчет KPI
    let workSeconds = logs.filter(l => l.type === 'work').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
    let breakSeconds = logs.filter(l => l.type === 'break').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
    const sessionsCount = logs.length;

    // Если смотрим сегодня — учитываем активные таймеры
    if (period === 'today') {
      TimerEngine.getActiveTimerIds().forEach(taskId => {
        if (TimerEngine.isRunning(taskId)) {
          const t = TimerEngine.timers.get(taskId);
          if (t && t.sessionStartTimestamp) {
            workSeconds += Math.floor((Date.now() - t.sessionStartTimestamp) / 1000);
          }
        }
      });
      if (TimerEngine.isBreakRunning()) {
        breakSeconds += TimerEngine.getBreakElapsedSeconds();
      }
    }

    const totalSeconds = workSeconds + breakSeconds;

    const elWork = document.getElementById('kpi-work-time');
    const elBreak = document.getElementById('kpi-break-time');
    const elTotal = document.getElementById('kpi-total-activity');
    const elDone = document.getElementById('kpi-sessions-count');

    if (elWork) elWork.textContent = TimerEngine.formatTimeReadable(workSeconds);
    if (elBreak) elBreak.textContent = TimerEngine.formatTimeReadable(breakSeconds);
    if (elTotal) elTotal.textContent = TimerEngine.formatTimeReadable(totalSeconds);
    if (elDone) elDone.textContent = `${sessionsCount} сессий`;

    // Рендерим графическую зону
    const chartsContainer = document.getElementById('stats-charts-container');
    if (chartsContainer) {
      if (isSingleDay) {
        chartsContainer.innerHTML = this.renderDayTimelineHtml(targetDateStr, logs);
      } else {
        chartsContainer.innerHTML = this.renderPeriodChartsHtml(logs, period);
      }
    }

    // Рендерим журнал сессий
    this.renderStatsLogsList(logs);
  },

  renderDayTimelineHtml(dayDateStr, logs) {
    const d = this.parseLocalDate(dayDateStr);
    const dayFormatted = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalized = dayFormatted.charAt(0).toUpperCase() + dayFormatted.slice(1);

    // Сортируем логи по времени начала
    const sortedLogs = [...logs].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

    // Сетка разметки каждые 3 часа (03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
    let gridLinesHtml = '';
    for (let h = 3; h <= 21; h += 3) {
      const leftPct = (h / 24) * 100;
      gridLinesHtml += `<div class="timeline-grid-line" style="left: ${leftPct}%;"></div>`;
    }

    // Построение 24-часовой полосы таймлайна
    let segmentsHtml = '';
    sortedLogs.forEach(log => {
      const s = new Date(log.startedAt);
      const e = new Date(log.endedAt);
      const startMin = s.getHours() * 60 + s.getMinutes();
      const durationMin = Math.max(1, Math.round((log.durationSeconds || 0) / 60));
      
      const leftPct = (startMin / 1440) * 100;
      const widthPct = Math.max(0.7, (durationMin / 1440) * 100);

      const startTimeStr = s.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = e.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const durationFormatted = TimerEngine.formatTimeReadable(log.durationSeconds);
      const tooltip = `${startTimeStr} — ${endTimeStr} (${durationFormatted}): ${log.taskTitle || 'Сессия'}`;

      const isBreak = log.type === 'break';
      const customBg = (!isBreak && log.color) ? `background-color: ${log.color};` : '';

      // Если сегмент достаточно широкий (например, >= 5.5% ширины шкалы = ~80+ минут), выводим длительность
      let labelHtml = '';
      if (widthPct >= 5.5) {
        labelHtml = `<span class="timeline-seg-label">${durationFormatted}</span>`;
      } else if (widthPct >= 2.5) {
        labelHtml = `<span class="timeline-seg-label-mini">${startTimeStr}</span>`;
      }

      segmentsHtml += `
        <div class="timeline-segment ${isBreak ? 'is-break' : 'is-work'}" 
             id="timeline-seg-${log.id}"
             data-log-id="${log.id}"
             style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%; ${customBg}" 
             onmouseenter="App.highlightTimeLog('${log.id}', true)"
             onmouseleave="App.highlightTimeLog('${log.id}', false)"
             onclick="App.scrollToTimeLog('${log.id}')"
             title="${this.escapeHtml(tooltip)}">
          ${labelHtml}
        </div>
      `;
    });

    // Хронологическая поминутная лента
    let feedHtml = '';
    if (sortedLogs.length === 0) {
      feedHtml = `
        <div class="empty-state" style="padding: 20px 0;">
          <div class="empty-icon">⏱️</div>
          <div class="empty-title">За этот день нет записей сессий</div>
          <div class="empty-desc">Запустите таймер на задаче, начните перерыв или добавьте запись вручную кнопкой выше.</div>
        </div>
      `;
    } else {
      feedHtml = `<div class="timeline-feed-wrap">`;
      sortedLogs.forEach(log => {
        const s = new Date(log.startedAt);
        const e = new Date(log.endedAt);
        const startTimeStr = s.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = e.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const isBreak = log.type === 'break';

        let projName = '';
        if (!isBreak && log.projectId) {
          const fInfo = this.findFolderInfo(log.projectId);
          if (fInfo && fInfo.folder) projName = fInfo.folder.name;
        }

        const borderStyle = (!isBreak && log.color) ? `border-left-color: ${log.color};` : '';
        const showNote = log.note && log.note.trim() && log.note !== 'Выполненная задача' && log.note !== 'Учтенное рабочее время';

        feedHtml += `
          <div class="timeline-feed-item ${isBreak ? 'is-break' : ''}" 
               id="timeline-feed-item-${log.id}"
               data-log-id="${log.id}"
               style="${borderStyle}"
               onmouseenter="App.highlightTimeLog('${log.id}', true)"
               onmouseleave="App.highlightTimeLog('${log.id}', false)"
               onclick="App.scrollToTimeSegment('${log.id}')">
            <div class="timeline-item-time-col">
              <span class="timeline-time-badge">${startTimeStr} — ${endTimeStr}</span>
              <span class="timeline-duration-badge">${TimerEngine.formatTimeReadable(log.durationSeconds)}</span>
            </div>
            <div class="timeline-item-content">
              <span class="timeline-item-title">${this.escapeHtml(log.taskTitle || (isBreak ? '☕ Перерыв / Отдых' : 'Задача'))}${log.subtaskTitle ? ` <span class="timeline-subtask-badge">❯ 🔹 ${this.escapeHtml(log.subtaskTitle)}</span>` : ''}</span>
              ${projName ? `<span class="timeline-item-project">📁 ${this.escapeHtml(projName)}</span>` : ''}
              ${showNote ? `<span class="stats-log-note">«${this.escapeHtml(log.note)}»</span>` : ''}
            </div>
            <div style="display: flex; gap: 4px; align-items: center; margin-left: auto;">
              <button type="button" class="btn-icon" title="Редактировать запись времени" onclick="event.stopPropagation(); App.editTimelineItem('${log.id}')" style="opacity: 0.85;">
                ✏️
              </button>
              <button type="button" class="btn-icon btn-delete" title="Удалить запись времени" onclick="event.stopPropagation(); App.deleteTimeLog('${log.id}')" style="opacity: 0.85;">
                🗑
              </button>
            </div>
          </div>
        `;
      });
      feedHtml += `</div>`;
    }

    return `
      <div class="day-timeline-card">
        <div class="day-timeline-header">
          <div class="day-timeline-title">
            <span>📅 График дня:</span> <b>${capitalized}</b>
          </div>
          <div class="day-timeline-legend">
            <div class="legend-item"><span class="legend-dot is-work"></span> Работа</div>
            <div class="legend-item"><span class="legend-dot is-break"></span> Перерыв</div>
            <div class="legend-item"><span class="legend-dot is-free"></span> Свободно</div>
          </div>
        </div>

        <div class="day-timeline-bar-wrap">
          <div class="timeline-axis-hours">
            <span>00:00</span>
            <span>03:00</span>
            <span>06:00</span>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
            <span>21:00</span>
            <span>24:00</span>
          </div>
          <div class="day-timeline-bar">
            ${gridLinesHtml}
            ${segmentsHtml}
          </div>
        </div>

        ${feedHtml}
      </div>
    `;
  },

  renderPeriodChartsHtml(logs, periodType) {
    // 1. Формируем список дней периода
    const dayCols = [];
    let maxSecondsInDay = 3600; // минимум для масштабирования (1 час)

    if (periodType === 'custom' && this.statsDateFrom && this.statsDateTo) {
      const d1 = this.parseLocalDate(this.statsDateFrom);
      const d2 = this.parseLocalDate(this.statsDateTo);
      let cur = new Date(d1);
      while (cur <= d2) {
        const dateStr = this.getLocalDateStr(cur);
        const shortLabel = cur.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' });
        const dayLogs = logs.filter(l => l.dateStr === dateStr);
        const workSec = dayLogs.filter(l => l.type === 'work').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const breakSec = dayLogs.filter(l => l.type === 'break').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const totalSec = workSec + breakSec;

        if (totalSec > maxSecondsInDay) maxSecondsInDay = totalSec;
        dayCols.push({ dateStr, shortLabel, workSec, breakSec, totalSec });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const daysCount = periodType === 'week' ? 7 : (periodType === 'month' ? 30 : 14);
      for (let i = daysCount - 1; i >= 0; i--) {
        const dateStr = this.getLocalDatePlusDays(-i);
        const d = this.parseLocalDate(dateStr);
        const shortLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' });

        const dayLogs = logs.filter(l => l.dateStr === dateStr);
        const workSec = dayLogs.filter(l => l.type === 'work').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const breakSec = dayLogs.filter(l => l.type === 'break').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const totalSec = workSec + breakSec;

        if (totalSec > maxSecondsInDay) maxSecondsInDay = totalSec;
        dayCols.push({ dateStr, shortLabel, workSec, breakSec, totalSec });
      }
    }

    let barsHtml = '';
    dayCols.forEach(col => {
      const workHeightPct = ((col.workSec / maxSecondsInDay) * 100).toFixed(1);
      const breakHeightPct = ((col.breakSec / maxSecondsInDay) * 100).toFixed(1);
      const titleTooltip = `${col.shortLabel}: Работа ${TimerEngine.formatTimeReadable(col.workSec)}, Перерывы ${TimerEngine.formatTimeReadable(col.breakSec)}`;

      barsHtml += `
        <div class="barchart-col" title="${this.escapeHtml(titleTooltip)}">
          <div class="barchart-bar-stack">
            <div class="barchart-segment-work" style="height: ${workHeightPct}%;"></div>
            <div class="barchart-segment-break" style="height: ${breakHeightPct}%;"></div>
          </div>
          <span class="barchart-col-label">${col.shortLabel}</span>
        </div>
      `;
    });

    // 2. Распределение по проектам и категориям
    const totalWorkSec = logs.filter(l => l.type === 'work').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
    const totalBreakSec = logs.filter(l => l.type === 'break').reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
    const totalActivitySec = totalWorkSec + totalBreakSec;

    const projectMap = new Map();
    logs.filter(l => l.type === 'work').forEach(log => {
      let key = 'Общие задачи';
      let color = '#4f6ef7';
      if (log.projectId) {
        const info = this.findFolderInfo(log.projectId);
        if (info && info.folder) {
          key = `${info.folder.icon || '📂'} ${info.folder.name}`;
          color = info.folder.color || '#4f6ef7';
        }
      }
      if (!projectMap.has(key)) {
        projectMap.set(key, { name: key, seconds: 0, color: color });
      }
      projectMap.get(key).seconds += (log.durationSeconds || 0);
    });

    let catRowsHtml = '';
    const sortedProjects = Array.from(projectMap.values()).sort((a, b) => b.seconds - a.seconds);

    sortedProjects.forEach(proj => {
      const pct = totalActivitySec > 0 ? Math.round((proj.seconds / totalActivitySec) * 100) : 0;
      catRowsHtml += `
        <div class="category-row">
          <div class="category-info-row">
            <span class="category-name">${this.escapeHtml(proj.name)}</span>
            <span class="category-stats-text">${TimerEngine.formatTimeReadable(proj.seconds)} (${pct}%)</span>
          </div>
          <div class="category-track">
            <div class="category-fill" style="width: ${pct}%; background-color: ${proj.color};"></div>
          </div>
        </div>
      `;
    });

    // Строка для перерывов
    const breakPct = totalActivitySec > 0 ? Math.round((totalBreakSec / totalActivitySec) * 100) : 0;
    catRowsHtml += `
      <div class="category-row">
        <div class="category-info-row">
          <span class="category-name">☕ Перерывы и отдых</span>
          <span class="category-stats-text">${TimerEngine.formatTimeReadable(totalBreakSec)} (${breakPct}%)</span>
        </div>
        <div class="category-track">
          <div class="category-fill" style="width: ${breakPct}%; background-color: #f59e0b;"></div>
        </div>
      </div>
    `;

    return `
      <div class="period-charts-grid">
        <div class="period-barchart-card">
          <div class="barchart-header">
            <h3 class="barchart-title">📊 Распределение времени по дням</h3>
            <div class="day-timeline-legend">
              <div class="legend-item"><span class="legend-dot is-work"></span> Работа</div>
              <div class="legend-item"><span class="legend-dot is-break"></span> Перерыв</div>
            </div>
          </div>
          <div class="barchart-bars-container">
            ${barsHtml}
          </div>
        </div>

        <div class="category-breakdown-card">
          <div class="barchart-header">
            <h3 class="barchart-title">📁 По проектам и отдыху</h3>
          </div>
          <div class="category-progress-list">
            ${catRowsHtml}
          </div>
        </div>
      </div>
    `;
  },

  renderStatsLogsList(logs) {
    const listEl = document.getElementById('stats-logs-list');
    const countEl = document.getElementById('stats-logs-count');
    if (!listEl) return;

    if (countEl) countEl.textContent = `${logs.length} записей`;

    if (logs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 16px 0;">
          <div class="empty-title" style="font-size: 13.5px;">За выбранный период сессий не найдено</div>
        </div>
      `;
      return;
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    let html = '';
    sortedLogs.forEach(log => {
      const s = new Date(log.startedAt);
      const e = new Date(log.endedAt);
      const dateDisp = s.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const startTimeStr = s.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = e.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const isBreak = log.type === 'break';
      const icon = isBreak ? '☕' : '💼';
      const showNote = log.note && log.note.trim() && log.note !== 'Выполненная задача' && log.note !== 'Учтенное рабочее время';

      html += `
        <div class="stats-log-row">
          <div class="stats-log-left">
            <span class="stats-log-type-icon">${icon}</span>
            <span class="stats-log-title">${this.escapeHtml(log.taskTitle || (isBreak ? 'Перерыв' : 'Задача'))}${log.subtaskTitle ? ` <span class="timeline-subtask-badge">❯ 🔹 ${this.escapeHtml(log.subtaskTitle)}</span>` : ''}</span>
            ${showNote ? `<span class="stats-log-note">«${this.escapeHtml(log.note)}»</span>` : ''}
          </div>
          <div class="stats-log-right">
            <span class="stats-log-time-range">${dateDisp} ${startTimeStr} — ${endTimeStr}</span>
            <span class="stats-log-duration">${TimerEngine.formatTimeReadable(log.durationSeconds)}</span>
            <button type="button" class="btn-icon-sm" onclick="App.editTimelineItem('${log.id}')" title="Редактировать запись">✏️</button>
            <button type="button" class="btn-icon-sm" onclick="App.deleteTimeLog('${log.id}')" title="Удалить запись">🗑</button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  editTimelineItem(logId) {
    this.openManualTimeLogModal(logId);
  },

  openTaskFromTimeLogModal() {
    const taskId = document.getElementById('modal-time-log-task-select')?.value;
    if (taskId) {
      this.closeModal('modal-manual-time-log');
      setTimeout(() => this.openEditTaskModal(taskId), 50);
    }
  },

  deleteTimeLog(logId) {
    if (confirm('Удалить эту запись времени из статистики?')) {
      const log = (this.data.timeLogs || []).find(l => l.id === logId);
      const taskId = log?.taskId;
      this.data.timeLogs = (this.data.timeLogs || []).filter(l => l.id !== logId);
      if (taskId) {
        const task = this.data.tasks.find(t => t.id === taskId) ||
                     (this.data.completedTasks || []).find(t => t.id === taskId);
        if (task) {
          const sumSec = this.data.timeLogs
            .filter(l => l.type === 'work' && l.taskId === taskId)
            .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
          task.timeSpentSeconds = sumSec;
          task.updatedAt = new Date().toISOString();
        }
      }
      this.saveData();
      this.renderStatsView();
      this.renderCurrentView();
      this.updateTimerDisplays();
    }
  },

  highlightTimeLog(logId, isHighlighted) {
    if (!logId) return;
    const seg = document.getElementById(`timeline-seg-${logId}`);
    const card = document.getElementById(`timeline-feed-item-${logId}`);
    const allCards = document.querySelectorAll('.timeline-feed-item');
    const allSegs = document.querySelectorAll('.timeline-segment');

    if (isHighlighted) {
      if (seg) seg.classList.add('is-highlighted');
      if (card) card.classList.add('is-highlighted');
      allCards.forEach(c => {
        if (c.getAttribute('data-log-id') !== logId) c.classList.add('dimmed');
      });
      allSegs.forEach(s => {
        if (s.getAttribute('data-log-id') !== logId) s.classList.add('dimmed');
      });
    } else {
      allCards.forEach(c => c.classList.remove('is-highlighted', 'dimmed'));
      allSegs.forEach(s => s.classList.remove('is-highlighted', 'dimmed'));
    }
  },

  scrollToTimeLog(logId) {
    const card = document.getElementById(`timeline-feed-item-${logId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.highlightTimeLog(logId, true);
      card.classList.add('pulse-active');
      setTimeout(() => {
        card.classList.remove('pulse-active');
      }, 1400);
    }
  },

  scrollToTimeSegment(logId) {
    const seg = document.getElementById(`timeline-seg-${logId}`);
    if (seg) {
      this.highlightTimeLog(logId, true);
    }
  },

  // =========================================================================
  // Модальное окно ручного добавления/редактирования сессии времени
  // =========================================================================
  timeLogCalcMode: 'until_now',

  setTimeLogCalcMode(mode) {
    this.timeLogCalcMode = mode || 'until_now';
    localStorage.setItem('planer_time_log_calc_mode', this.timeLogCalcMode);
    const untilBtn = document.getElementById('btn-calc-mode-until-now');
    const fromBtn = document.getElementById('btn-calc-mode-from-now');
    const modeInput = document.getElementById('modal-time-log-calc-mode');
    if (modeInput) modeInput.value = this.timeLogCalcMode;

    if (this.timeLogCalcMode === 'until_now') {
      if (untilBtn) untilBtn.classList.add('active');
      if (fromBtn) fromBtn.classList.remove('active');
    } else {
      if (untilBtn) untilBtn.classList.remove('active');
      if (fromBtn) fromBtn.classList.add('active');
    }

    const now = new Date();
    const curHours = String(now.getHours()).padStart(2, '0');
    const curMins = String(now.getMinutes()).padStart(2, '0');
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');

    if (this.timeLogCalcMode === 'from_now') {
      if (startInput) startInput.value = `${curHours}:${curMins}`;
    } else {
      if (endInput) endInput.value = `${curHours}:${curMins}`;
    }

    this.onTimeLogDurationChange();
  },

  setTimeLogStartToNow() {
    const startInput = document.getElementById('modal-time-log-start');
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (startInput) startInput.value = `${h}:${m}`;
    if (this.timeLogCalcMode === 'from_now') {
      this.onTimeLogDurationChange();
    } else {
      this.onTimeLogIntervalChange('start');
    }
  },

  setTimeLogEndToNow() {
    const endInput = document.getElementById('modal-time-log-end');
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (endInput) endInput.value = `${h}:${m}`;
    if (this.timeLogCalcMode === 'until_now') {
      this.onTimeLogDurationChange();
    } else {
      this.onTimeLogIntervalChange('end');
    }
  },

  openManualTimeLogForTask(taskId, subtaskId = null) {
    this.populateProjectSelects();
    const task = this.data.tasks.find(t => t.id === taskId) || 
                 (this.data.completedTasks || []).find(t => t.id === taskId);
    if (!task) return;

    let subtask = null;
    let targetSeconds = task.timeSpentSeconds || 0;
    if (subtaskId && Array.isArray(task.subtasks)) {
      subtask = task.subtasks.find(s => s.id === subtaskId);
      if (subtask) {
        targetSeconds = subtask.timeSpentSeconds || 0;
      }
    }

    const titleModal = document.getElementById('modal-time-log-title');
    const editIdInput = document.getElementById('modal-time-log-edit-id');
    const dateInput = document.getElementById('modal-time-log-date');
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');
    const noteInput = document.getElementById('modal-time-log-note');
    const customTitleInput = document.getElementById('modal-time-log-custom-title');
    const taskSelect = document.getElementById('modal-time-log-task-select');
    const taskBtn = document.getElementById('btn-edit-linked-task');
    const deleteBtn = document.getElementById('btn-delete-time-log-modal');
    const hoursInput = document.getElementById('modal-time-log-hours');
    const minsInput = document.getElementById('modal-time-log-minutes');

    if (titleModal) {
      titleModal.textContent = subtask ? `⏱️ Время подпункта: ${subtask.text}` : `⏱️ Время задачи: ${task.title}`;
    }

    if (editIdInput) editIdInput.value = '';
    if (dateInput) dateInput.value = this.getLocalDateStr();

    const savedMode = localStorage.getItem('planer_time_log_calc_mode') || 'until_now';
    this.timeLogCalcMode = savedMode;
    const modeInput = document.getElementById('modal-time-log-calc-mode');
    if (modeInput) modeInput.value = savedMode;
    const untilBtn = document.getElementById('btn-calc-mode-until-now');
    const fromBtn = document.getElementById('btn-calc-mode-from-now');
    if (savedMode === 'until_now') {
      if (untilBtn) untilBtn.classList.add('active');
      if (fromBtn) fromBtn.classList.remove('active');
    } else {
      if (untilBtn) untilBtn.classList.remove('active');
      if (fromBtn) fromBtn.classList.add('active');
    }

    const now = new Date();
    const curHours = String(now.getHours()).padStart(2, '0');
    const curMins = String(now.getMinutes()).padStart(2, '0');
    const durMins = targetSeconds > 0 ? Math.round(targetSeconds / 60) : 15;

    if (savedMode === 'until_now') {
      // Окончание = Текущее время (сейчас), Начало = сейчас - длительность
      if (endInput) endInput.value = `${curHours}:${curMins}`;
      const startMs = now.getTime() - (durMins * 60000);
      const startDate = new Date(startMs);
      const sH = String(startDate.getHours()).padStart(2, '0');
      const sM = String(startDate.getMinutes()).padStart(2, '0');
      if (startInput) startInput.value = `${sH}:${sM}`;
    } else {
      // Начало = Текущее время (сейчас), Окончание = сейчас + длительность
      if (startInput) startInput.value = `${curHours}:${curMins}`;
      const endMs = now.getTime() + (durMins * 60000);
      const endDate = new Date(endMs);
      const eH = String(endDate.getHours()).padStart(2, '0');
      const eM = String(endDate.getMinutes()).padStart(2, '0');
      if (endInput) endInput.value = `${eH}:${eM}`;
    }

    const hVal = Math.floor(durMins / 60);
    const mVal = durMins % 60;
    if (hoursInput) hoursInput.value = hVal > 0 ? hVal : '';
    if (minsInput) minsInput.value = mVal > 0 ? mVal : (hVal > 0 ? '0' : '');

    if (noteInput) noteInput.value = subtask ? `Подпункт: ${subtask.text}` : '';
    if (customTitleInput) customTitleInput.value = '';
    if (taskSelect) taskSelect.value = task.id;
    if (taskBtn) taskBtn.style.display = 'inline-flex';
    if (deleteBtn) deleteBtn.style.display = 'none';

    this.setManualLogType('work');
    this.onTimeLogIntervalChange();
    this.openModal('modal-manual-time-log');
  },

  openManualTimeLogModal(logId = null) {
    this.populateProjectSelects();
    const titleModal = document.getElementById('modal-time-log-title');
    const editIdInput = document.getElementById('modal-time-log-edit-id');
    const dateInput = document.getElementById('modal-time-log-date');
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');
    const noteInput = document.getElementById('modal-time-log-note');
    const customTitleInput = document.getElementById('modal-time-log-custom-title');
    const taskSelect = document.getElementById('modal-time-log-task-select');
    const taskBtn = document.getElementById('btn-edit-linked-task');
    const deleteBtn = document.getElementById('btn-delete-time-log-modal');

    const savedMode = localStorage.getItem('planer_time_log_calc_mode') || 'until_now';
    this.timeLogCalcMode = savedMode;
    const modeInput = document.getElementById('modal-time-log-calc-mode');
    if (modeInput) modeInput.value = savedMode;
    const untilBtn = document.getElementById('btn-calc-mode-until-now');
    const fromBtn = document.getElementById('btn-calc-mode-from-now');
    if (savedMode === 'until_now') {
      if (untilBtn) untilBtn.classList.add('active');
      if (fromBtn) fromBtn.classList.remove('active');
    } else {
      if (untilBtn) untilBtn.classList.remove('active');
      if (fromBtn) fromBtn.classList.add('active');
    }

    if (logId) {
      const log = (this.data.timeLogs || []).find(l => l.id === logId);
      if (log) {
        if (titleModal) titleModal.textContent = '✏️ Редактировать запись времени';
        if (editIdInput) editIdInput.value = log.id;
        if (dateInput) dateInput.value = log.dateStr || log.startedAt.slice(0, 10);
        if (startInput) startInput.value = new Date(log.startedAt).toTimeString().slice(0, 5);
        if (endInput) endInput.value = new Date(log.endedAt).toTimeString().slice(0, 5);
        if (noteInput) noteInput.value = log.note || '';
        if (customTitleInput) customTitleInput.value = log.taskTitle || '';
        if (taskSelect && log.taskId) taskSelect.value = log.taskId;
        if (taskBtn) taskBtn.style.display = log.taskId ? 'inline-flex' : 'none';
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        this.setManualLogType(log.type || 'work');
        this.onTimeLogIntervalChange();
        this.openModal('modal-manual-time-log');
        return;
      }
    }

    if (titleModal) titleModal.textContent = '⏱ Добавить время';
    if (editIdInput) editIdInput.value = '';
    if (dateInput) dateInput.value = this.getLocalDateStr();

    const now = new Date();
    const curHours = String(now.getHours()).padStart(2, '0');
    const curMins = String(now.getMinutes()).padStart(2, '0');
    if (savedMode === 'until_now') {
      if (endInput) endInput.value = `${curHours}:${curMins}`;
      const startMs = now.getTime() - (45 * 60000);
      const startDate = new Date(startMs);
      const sH = String(startDate.getHours()).padStart(2, '0');
      const sM = String(startDate.getMinutes()).padStart(2, '0');
      if (startInput) startInput.value = `${sH}:${sM}`;
    } else {
      if (startInput) startInput.value = `${curHours}:${curMins}`;
      const endMs = now.getTime() + (45 * 60000);
      const endDate = new Date(endMs);
      const eH = String(endDate.getHours()).padStart(2, '0');
      const eM = String(endDate.getMinutes()).padStart(2, '0');
      if (endInput) endInput.value = `${eH}:${eM}`;
    }

    if (noteInput) noteInput.value = '';
    if (customTitleInput) customTitleInput.value = '';
    if (taskBtn) taskBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';

    this.setManualLogType('work');
    this.onTimeLogIntervalChange();
    this.openModal('modal-manual-time-log');
  },

  deleteTimeLogFromModal() {
    const editId = document.getElementById('modal-time-log-edit-id')?.value;
    if (editId) {
      this.closeModal('modal-manual-time-log');
      this.deleteTimeLog(editId);
    }
  },

  onTimeLogIntervalChange(changedField = null) {
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');
    const dateInput = document.getElementById('modal-time-log-date');
    const hoursInput = document.getElementById('modal-time-log-hours');
    const minsInput = document.getElementById('modal-time-log-minutes');
    const disp = document.getElementById('modal-time-log-duration-display');

    if (!startInput || !endInput) return;

    const dateStr = dateInput?.value || this.getLocalDateStr();
    const startTimeStr = startInput.value || '09:00';
    const endTimeStr = endInput.value || '09:45';

    const startMs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
    let endMs = new Date(`${dateStr}T${endTimeStr}:00`).getTime();

    if (endMs < startMs) {
      endMs += 24 * 3600 * 1000;
    }

    const diffMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hoursInput) hoursInput.value = hours > 0 ? hours : '';
    if (minsInput) minsInput.value = minutes > 0 ? minutes : (hours > 0 ? '0' : '');
    if (disp) disp.textContent = TimerEngine.formatTimeReadable(diffMinutes * 60);
  },

  onTimeLogDurationChange() {
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');
    const dateInput = document.getElementById('modal-time-log-date');
    const hoursInput = document.getElementById('modal-time-log-hours');
    const minsInput = document.getElementById('modal-time-log-minutes');
    const disp = document.getElementById('modal-time-log-duration-display');

    if (!startInput || !endInput) return;

    const hours = parseInt(hoursInput?.value, 10) || 0;
    const minutes = parseInt(minsInput?.value, 10) || 0;
    const totalMinutes = Math.max(0, (hours * 60) + minutes);

    if (disp) disp.textContent = TimerEngine.formatTimeReadable(totalMinutes * 60);

    const dateStr = dateInput?.value || this.getLocalDateStr();
    const calcMode = this.timeLogCalcMode || 'until_now';

    if (calcMode === 'until_now') {
      // Считаем назад от времени окончания (по умолчанию текущее время)
      let endTimeStr = endInput.value;
      if (!endTimeStr) {
        const now = new Date();
        endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        endInput.value = endTimeStr;
      }
      const endMs = new Date(`${dateStr}T${endTimeStr}:00`).getTime();
      const startMs = endMs - (totalMinutes * 60000);
      const startDate = new Date(startMs);
      const startHours = String(startDate.getHours()).padStart(2, '0');
      const startMins = String(startDate.getMinutes()).padStart(2, '0');
      startInput.value = `${startHours}:${startMins}`;
    } else {
      // Считаем вперед от времени начала
      let startTimeStr = startInput.value;
      if (!startTimeStr) {
        const now = new Date();
        startTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        startInput.value = startTimeStr;
      }
      const startMs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
      const endMs = startMs + (totalMinutes * 60000);
      const endDate = new Date(endMs);
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMins = String(endDate.getMinutes()).padStart(2, '0');
      endInput.value = `${endHours}:${endMins}`;
    }
  },

  addMinutesToTimeLog(minsToAdd) {
    const hoursInput = document.getElementById('modal-time-log-hours');
    const minsInput = document.getElementById('modal-time-log-minutes');
    const currentHours = parseInt(hoursInput?.value, 10) || 0;
    const currentMins = parseInt(minsInput?.value, 10) || 0;
    let totalMins = (currentHours * 60) + currentMins + minsToAdd;
    if (totalMins < 0) totalMins = 0;

    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    if (hoursInput) hoursInput.value = newHours > 0 ? newHours : '';
    if (minsInput) minsInput.value = newMins > 0 ? newMins : (newHours > 0 ? '0' : '');

    const now = new Date();
    const curHours = String(now.getHours()).padStart(2, '0');
    const curMins = String(now.getMinutes()).padStart(2, '0');
    const startInput = document.getElementById('modal-time-log-start');
    const endInput = document.getElementById('modal-time-log-end');

    if (this.timeLogCalcMode === 'from_now') {
      if (startInput) startInput.value = `${curHours}:${curMins}`;
    } else {
      if (endInput) endInput.value = `${curHours}:${curMins}`;
    }

    this.onTimeLogDurationChange();
  },

  setManualLogType(type) {
    this.manualLogType = type;
    const typeInput = document.getElementById('modal-time-log-type');
    if (typeInput) typeInput.value = type;

    const workBtn = document.getElementById('log-type-work-btn');
    const breakBtn = document.getElementById('log-type-break-btn');
    const taskGroup = document.getElementById('modal-time-log-task-group');
    const titleGroup = document.getElementById('modal-time-log-title-group');

    if (type === 'break') {
      if (workBtn) workBtn.classList.remove('active');
      if (breakBtn) breakBtn.classList.add('active');
      if (taskGroup) taskGroup.style.display = 'none';
      if (titleGroup) titleGroup.style.display = 'block';
    } else {
      if (workBtn) workBtn.classList.add('active');
      if (breakBtn) breakBtn.classList.remove('active');
      if (taskGroup) taskGroup.style.display = 'block';
      if (titleGroup) titleGroup.style.display = 'none';
    }
  },

  saveManualTimeLog() {
    const editId = document.getElementById('modal-time-log-edit-id')?.value;
    const type = document.getElementById('modal-time-log-type')?.value || 'work';
    const dateStr = document.getElementById('modal-time-log-date')?.value || this.getLocalDateStr();
    const startTimeStr = document.getElementById('modal-time-log-start')?.value || '09:00';
    const endTimeStr = document.getElementById('modal-time-log-end')?.value || '09:45';
    const note = document.getElementById('modal-time-log-note')?.value || '';
    const taskId = document.getElementById('modal-time-log-task-select')?.value || null;
    const customTitle = document.getElementById('modal-time-log-custom-title')?.value || '';

    const startIso = new Date(`${dateStr}T${startTimeStr}:00`).toISOString();
    const endIso = new Date(`${dateStr}T${endTimeStr}:00`).toISOString();

    const startTimestamp = new Date(startIso).getTime();
    const endTimestamp = new Date(endIso).getTime();

    if (endTimestamp <= startTimestamp) {
      alert('Время окончания должно быть позже времени начала!');
      return;
    }

    const durationSeconds = Math.floor((endTimestamp - startTimestamp) / 1000);

    let taskTitle = type === 'break' ? (customTitle || '☕ Перерыв / Отдых') : 'Рабочая сессия';
    let sectionId = null;
    let projectId = null;
    let color = '';

    if (type === 'work' && taskId) {
      const task = this.data.tasks.find(t => t.id === taskId) ||
                   this.data.completedTasks.find(t => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        sectionId = task.sectionId;
        projectId = task.projectId;
        color = task.color || '';
      }
    }

    let subtaskId = null;
    let subtaskTitle = '';
    if (type === 'work' && taskId && note && note.startsWith('Подпункт: ')) {
      subtaskTitle = note.replace('Подпункт: ', '').trim();
      const tObj = this.data.tasks.find(t => t.id === taskId) || this.data.completedTasks.find(t => t.id === taskId);
      if (tObj && Array.isArray(tObj.subtasks)) {
        const sObj = tObj.subtasks.find(s => s.text === subtaskTitle);
        if (sObj) {
          subtaskId = sObj.id;
          sObj.timeSpentSeconds = durationSeconds;
        }
      }
    }

    if (!Array.isArray(this.data.timeLogs)) {
      this.data.timeLogs = [];
    }

    const affectedTaskIds = new Set();
    if (taskId) affectedTaskIds.add(taskId);

    if (editId) {
      const existing = this.data.timeLogs.find(l => l.id === editId);
      if (existing) {
        if (existing.taskId) affectedTaskIds.add(existing.taskId);
        existing.type = type;
        existing.taskId = taskId;
        existing.subtaskId = subtaskId;
        existing.subtaskTitle = subtaskTitle;
        existing.taskTitle = taskTitle;
        existing.sectionId = sectionId;
        existing.projectId = projectId;
        existing.color = color;
        existing.startedAt = startIso;
        existing.endedAt = endIso;
        existing.durationSeconds = durationSeconds;
        existing.dateStr = dateStr;
        existing.note = note;
      }
    } else {
      const newLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: type,
        taskId: taskId,
        subtaskId: subtaskId,
        subtaskTitle: subtaskTitle,
        taskTitle: taskTitle,
        sectionId: sectionId,
        projectId: projectId,
        color: color,
        startedAt: startIso,
        endedAt: endIso,
        durationSeconds: durationSeconds,
        dateStr: dateStr,
        note: note
      };
      this.data.timeLogs.push(newLog);
    }

    // Пересчитываем суммарное время для задач
    affectedTaskIds.forEach(tId => {
      const task = this.data.tasks.find(t => t.id === tId) ||
                   (this.data.completedTasks || []).find(t => t.id === tId);
      if (task) {
        const sumSec = this.data.timeLogs
          .filter(l => l.type === 'work' && l.taskId === tId)
          .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        task.timeSpentSeconds = sumSec;
        task.updatedAt = new Date().toISOString();
      }
    });

    this.saveData();

    if (this.currentView === 'stats') {
      this.renderStatsView();
    }
    this.renderCurrentView();
    this.renderSidebar();
    this.updateBadges();
    this.updateTimerDisplays();
    this.closeModal('modal-manual-time-log');
  },

  // =========================================================================
  // Рендеринг Архива «Выполнено»
  // =========================================================================
  setArchivePeriod(period) {
    this.archiveFilters.period = period;
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-filter[data-period="${period}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const customDateBox = document.getElementById('custom-date-range');
    if (period === 'custom') {
      customDateBox.style.display = 'flex';
      const today = new Date().toISOString().slice(0, 10);
      document.getElementById('archive-date-from').value = today;
      document.getElementById('archive-date-to').value = today;
    } else {
      customDateBox.style.display = 'none';
    }

    this.applyArchiveFilters();
  },

  applyArchiveFilters() {
    const sectionSelect = document.getElementById('archive-section-filter');
    const searchInput = document.getElementById('archive-search-input');
    
    this.archiveFilters.sectionId = sectionSelect ? sectionSelect.value : 'all';
    this.archiveFilters.searchQuery = searchInput ? searchInput.value.trim() : '';

    if (this.archiveFilters.period === 'custom') {
      this.archiveFilters.dateFrom = document.getElementById('archive-date-from').value;
      this.archiveFilters.dateTo = document.getElementById('archive-date-to').value;
    }

    this.renderArchive();
  },

  renderArchive() {
    const container = document.getElementById('archive-list');
    const emptyState = document.getElementById('archive-empty-state');
    if (!container) return;

    let items = [...this.data.completedTasks];

    // Если в настройках включено отображение напоминаний в архиве
    if (this.data.settings?.remindersInArchive) {
      const completedReminders = (this.data.reminders || []).filter(r => r.completed).map(r => ({
        id: r.id,
        title: `🔔 ${r.text}`,
        description: `Автономное напоминание (${r.dueDate || ''} ${r.time || ''})`,
        completed: true,
        completedAt: r.completedAt || r.updatedAt || r.createdAt || new Date().toISOString(),
        timeSpentSeconds: 0,
        color: r.color || '#f59e0b',
        sectionId: 'reminders',
        projectId: 'reminders',
        isReminder: true
      }));
      items = items.concat(completedReminders);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    if (this.archiveFilters.period === 'today') {
      items = items.filter(t => new Date(t.completedAt).getTime() >= todayStart);
    } else if (this.archiveFilters.period === 'yesterday') {
      items = items.filter(t => {
        const time = new Date(t.completedAt).getTime();
        return time >= yesterdayStart && time < todayStart;
      });
    } else if (this.archiveFilters.period === 'week') {
      const weekStart = todayStart - (7 * 86400000);
      items = items.filter(t => new Date(t.completedAt).getTime() >= weekStart);
    } else if (this.archiveFilters.period === 'month') {
      const monthStart = todayStart - (30 * 86400000);
      items = items.filter(t => new Date(t.completedAt).getTime() >= monthStart);
    } else if (this.archiveFilters.period === 'custom' && this.archiveFilters.dateFrom && this.archiveFilters.dateTo) {
      const from = new Date(this.archiveFilters.dateFrom + 'T00:00:00').getTime();
      const to = new Date(this.archiveFilters.dateTo + 'T23:59:59').getTime();
      items = items.filter(t => {
        const time = new Date(t.completedAt).getTime();
        return time >= from && time <= to;
      });
    }

    if (this.archiveFilters.sectionId && this.archiveFilters.sectionId !== 'all') {
      const filterVal = this.archiveFilters.sectionId;
      if (filterVal.startsWith('sec:')) {
        const secId = filterVal.replace('sec:', '');
        items = items.filter(t => t.sectionId === secId);
      } else if (filterVal.startsWith('proj:')) {
        const [, secId, projId] = filterVal.split(':');
        const folderInfo = this.findFolderInfo(projId);
        if (folderInfo) {
          const allIds = this.getAllChildFolderIds(folderInfo.folder);
          items = items.filter(t => t.sectionId === secId && allIds.includes(t.projectId));
        } else {
          items = items.filter(t => t.sectionId === secId && t.projectId === projId);
        }
      }
    }

    if (this.archiveFilters.searchQuery) {
      const q = this.archiveFilters.searchQuery.toLowerCase();
      items = items.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    items.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    const statCount = document.getElementById('stat-completed-count');
    const statTime = document.getElementById('stat-total-time');
    const totalSec = items.reduce((sum, t) => sum + (t.timeSpentSeconds || 0), 0);

    if (statCount) statCount.textContent = items.length;
    if (statTime) statTime.textContent = TimerEngine.formatTimeReadable(totalSec);

    if (items.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    const groups = new Map();
    items.forEach(task => {
      const d = new Date(task.completedAt);
      const dateKey = d.toISOString().slice(0, 10);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey).push(task);
    });

    let html = '';
    groups.forEach((groupTasks, dateKey) => {
      const d = new Date(dateKey + 'T00:00:00');
      let dateHeaderStr = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      dateHeaderStr = dateHeaderStr.charAt(0).toUpperCase() + dateHeaderStr.slice(1);

      html += `
        <div class="archive-date-group">
          <div class="archive-date-header">
            <span>📅 ${dateHeaderStr}</span>
            <span class="badge badge-done">${groupTasks.length} выполнено</span>
          </div>
      `;

      groupTasks.forEach(task => {
        const compDate = new Date(task.completedAt);
        const timeStr = compDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (task.isReminder) {
          html += `
            <div class="archive-task-item" style="border-left: 4px solid #f59e0b;">
              <span class="archive-done-icon">🔔</span>
              
              <div class="archive-task-content">
                <div class="archive-task-title">${this.escapeHtml(task.title)}</div>
                <div class="archive-meta" style="margin-top: 4px;">
                  <span class="tag-project">🔔 Автономное напоминание</span>
                  <span>🕒 Завершено в ${timeStr}</span>
                </div>
              </div>

              <div class="task-actions">
                <button class="btn-icon btn-delete" onclick="App.deleteReminder('${task.id}'); App.renderArchive();" title="Удалить напоминание">
                  🗑
                </button>
              </div>
            </div>
          `;
          return;
        }

        const folderInfo = this.findFolderInfo(task.projectId);
        const projName = folderInfo ? folderInfo.folder.name : 'Общие';
        const projIcon = folderInfo ? (folderInfo.folder.icon || '📂') : '📂';
        const secIcon = folderInfo ? (folderInfo.section.icon || '💼') : '💼';

        const timeSpentStr = task.timeSpentSeconds > 0 ? `⏱ ${TimerEngine.formatTimeReadable(task.timeSpentSeconds)}` : '';
        const taskColorStyle = task.color ? `border-left: 4px solid ${task.color};` : '';
        const formattedTitle = this.formatTitleWithHashtags(task.title);

        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
        const hasDesc = !!(task.description && task.description.trim());
        const hasNote = !!((task.noteHtml && task.noteHtml.trim()) || (task.noteText && task.noteText.trim()));

        html += `
          <div class="archive-task-item" style="${taskColorStyle}">
            <span class="archive-done-icon">✓</span>
            
            <div class="archive-task-content">
              <div class="archive-task-title" ondblclick="App.openTaskNoteModal('${task.id}')" title="${hasNote ? 'Двойной клик: открыть заметку' : ''}">${formattedTitle}</div>
              ${hasDesc ? `<div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">${this.escapeHtml(task.description)}</div>` : ''}
              ${subtasks.length > 0 ? `
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  ☑ Выполнено подпунктов: ${subtasks.filter(s => s.completed).length}/${subtasks.length}
                </div>
              ` : ''}
              <div class="archive-meta" style="margin-top: 4px;">
                <span class="tag-project">${secIcon} ${projIcon} ${this.escapeHtml(projName)}</span>
                <span>🕒 Завершено в ${timeStr}</span>
                ${timeSpentStr ? `<span class="meta-time-spent">${timeSpentStr}</span>` : ''}
                ${hasNote ? `
                  <button type="button" class="btn-toggle-subtasks active" onclick="event.stopPropagation(); App.openTaskNoteModal('${task.id}')" title="Открыть подробную заметку и регламент">
                    <span>📖 Открыть заметку</span>
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="task-actions">
              <button class="btn-icon" title="📖 Открыть заметку / регламент" onclick="event.stopPropagation(); App.openTaskNoteModal('${task.id}')" style="${hasNote ? 'color: var(--accent-primary); font-weight: bold;' : ''}">
                📖
              </button>
              <button class="btn-subtle" style="font-size: 12px; padding: 4px 10px;" onclick="App.copyCompletedTaskToActive('${task.id}')" title="Создать копию задачи в активных делах">
                📋 Скопировать в активные
              </button>
              <button class="btn-subtle" style="font-size: 12px; padding: 4px 10px;" onclick="App.restoreTask('${task.id}')" title="Вернуть задачу в список активных">
                ↩ Вернуть в работу
              </button>
              <button class="btn-icon btn-delete" onclick="App.deleteCompletedTask('${task.id}')" title="Удалить навсегда">
                🗑
              </button>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    container.innerHTML = html;
  },

  // =========================================================================
  // Модальные окна: Папки и Разделы
  // =========================================================================
  openAddProjectModal(sectionId, parentFolderId = '') {
    document.getElementById('modal-project-title').textContent = parentFolderId ? 'Создать подпапку' : 'Создать папку';
    document.getElementById('modal-project-edit-id').value = '';
    document.getElementById('modal-project-icon').value = parentFolderId ? '📁' : '📂';
    document.getElementById('modal-project-name').value = '';
    
    const deleteBtn = document.getElementById('btn-delete-project-modal');
    if (deleteBtn) deleteBtn.style.display = 'none';

    const modalSelect = document.getElementById('modal-project-section-select');
    if (modalSelect && sectionId) {
      modalSelect.value = sectionId;
    }

    this.populateParentProjectSelects();
    const parentSelect = document.getElementById('modal-project-parent-select');
    if (parentSelect && parentFolderId) {
      parentSelect.value = parentFolderId;
    }

    this.renderEmojiPicker('project-emoji-grid', 'modal-project-icon', '');
    this.openModal('modal-project');
    setTimeout(() => document.getElementById('modal-project-name').focus(), 50);
  },

  openEditProjectModal(sectionId, projectId) {
    const folderInfo = this.findFolderInfo(projectId);
    if (!folderInfo) return;

    const { folder, parentFolder } = folderInfo;

    document.getElementById('modal-project-title').textContent = `Редактировать папку: ${folder.name}`;
    document.getElementById('modal-project-edit-id').value = projectId;
    document.getElementById('modal-project-icon').value = folder.icon || '📂';
    document.getElementById('modal-project-name').value = folder.name;

    const modalSelect = document.getElementById('modal-project-section-select');
    if (modalSelect) modalSelect.value = sectionId;

    this.populateParentProjectSelects(projectId);
    const parentSelect = document.getElementById('modal-project-parent-select');
    if (parentSelect) {
      parentSelect.value = parentFolder ? parentFolder.id : '';
    }

    const deleteBtn = document.getElementById('btn-delete-project-modal');
    if (deleteBtn) deleteBtn.style.display = 'inline-block';

    this.renderEmojiPicker('project-emoji-grid', 'modal-project-icon', '');
    this.openModal('modal-project');
    setTimeout(() => document.getElementById('modal-project-name').focus(), 50);
  },

  saveProjectModal() {
    const editProjectId = document.getElementById('modal-project-edit-id').value;
    const targetSecId = document.getElementById('modal-project-section-select').value;
    const targetParentId = document.getElementById('modal-project-parent-select').value;
    const name = document.getElementById('modal-project-name').value.trim();
    const icon = document.getElementById('modal-project-icon').value.trim() || '📂';
    if (!name) return;

    const targetSection = this.data.sections.find(s => s.id === targetSecId);
    if (!targetSection) return;
    if (!targetSection.projects) targetSection.projects = [];

    if (editProjectId) {
      const folderInfo = this.findFolderInfo(editProjectId);
      if (folderInfo) {
        const { folder, parentFolder, section: oldSection } = folderInfo;
        folder.name = name;
        folder.icon = icon;

        const oldParentId = parentFolder ? parentFolder.id : '';
        if (oldSection.id !== targetSecId || oldParentId !== targetParentId) {
          if (parentFolder) {
            parentFolder.children = parentFolder.children.filter(f => f.id !== editProjectId);
          } else {
            oldSection.projects = oldSection.projects.filter(f => f.id !== editProjectId);
          }

          if (targetParentId) {
            const newParentInfo = this.findFolderInfo(targetParentId);
            if (newParentInfo && newParentInfo.folder) {
              if (!newParentInfo.folder.children) newParentInfo.folder.children = [];
              newParentInfo.folder.children.push(folder);
              newParentInfo.folder.collapsed = false;
            } else {
              targetSection.projects.push(folder);
            }
          } else {
            targetSection.projects.push(folder);
          }

          const allAffectedFolderIds = this.getAllChildFolderIds(folder);
          this.data.tasks.forEach(t => {
            if (allAffectedFolderIds.includes(t.projectId)) t.sectionId = targetSecId;
          });
          this.data.completedTasks.forEach(t => {
            if (allAffectedFolderIds.includes(t.projectId)) t.sectionId = targetSecId;
          });
        }
      }
    } else {
      const newProj = {
        id: 'proj-' + Date.now(),
        name: name,
        icon: icon,
        collapsed: false,
        children: []
      };

      if (targetParentId) {
        const parentInfo = this.findFolderInfo(targetParentId);
        if (parentInfo && parentInfo.folder) {
          if (!parentInfo.folder.children) parentInfo.folder.children = [];
          parentInfo.folder.children.push(newProj);
          parentInfo.folder.collapsed = false;
        } else {
          targetSection.projects.push(newProj);
        }
      } else {
        targetSection.projects.push(newProj);
      }

      targetSection.collapsed = false;
      this.selectView({ sectionId: targetSecId, projectId: newProj.id });
    }

    this.saveData();
    this.populateProjectSelects();
    this.renderSidebar();
    this.updateBadges();
    this.renderCurrentView();
    this.closeModal('modal-project');
  },

  deleteProjectFromModal() {
    const editProjectId = document.getElementById('modal-project-edit-id').value;
    if (!editProjectId) return;

    const folderInfo = this.findFolderInfo(editProjectId);
    if (!folderInfo) return;

    if (confirm('Вы уверены, что хотите удалить эту папку со всеми ее подпапками и задачами?')) {
      const allFolderIds = this.getAllChildFolderIds(folderInfo.folder);

      if (window.SyncEngine) {
        allFolderIds.forEach(fId => SyncEngine.recordTombstone(fId, 'project'));
        const deletedTasks = this.data.tasks.filter(t => allFolderIds.includes(t.projectId));
        deletedTasks.forEach(t => SyncEngine.recordTombstone(t.id, 'task'));
      }

      if (folderInfo.parentFolder) {
        folderInfo.parentFolder.children = folderInfo.parentFolder.children.filter(f => f.id !== editProjectId);
      } else {
        folderInfo.section.projects = folderInfo.section.projects.filter(f => f.id !== editProjectId);
      }

      this.data.tasks = this.data.tasks.filter(t => !allFolderIds.includes(t.projectId));
      this.data.completedTasks = this.data.completedTasks.filter(t => !allFolderIds.includes(t.projectId));

      this.saveData();
      this.populateProjectSelects();
      this.renderSidebar();
      this.updateBadges();
      this.selectView('all');
      this.closeModal('modal-project');
    }
  },

  openAddSectionModal() {
    document.getElementById('modal-section-title').textContent = 'Создать новый раздел';
    document.getElementById('modal-section-edit-id').value = '';
    document.getElementById('modal-section-icon').value = '📌';
    document.getElementById('modal-section-name').value = '';

    const deleteBtn = document.getElementById('btn-delete-section-modal');
    if (deleteBtn) deleteBtn.style.display = 'none';

    this.renderEmojiPicker('section-emoji-grid', 'modal-section-icon', '');
    this.openModal('modal-section');
    setTimeout(() => document.getElementById('modal-section-name').focus(), 50);
  },

  openEditSectionModal(sectionId) {
    const section = this.data.sections.find(s => s.id === sectionId);
    if (!section) return;

    document.getElementById('modal-section-title').textContent = `Редактировать раздел: ${section.name}`;
    document.getElementById('modal-section-edit-id').value = sectionId;
    document.getElementById('modal-section-icon').value = section.icon || '📁';
    document.getElementById('modal-section-name').value = section.name;

    const deleteBtn = document.getElementById('btn-delete-section-modal');
    if (deleteBtn) deleteBtn.style.display = 'inline-block';

    this.renderEmojiPicker('section-emoji-grid', 'modal-section-icon', '');
    this.openModal('modal-section');
    setTimeout(() => document.getElementById('modal-section-name').focus(), 50);
  },

  saveSectionModal() {
    const editSectionId = document.getElementById('modal-section-edit-id').value;
    const name = document.getElementById('modal-section-name').value.trim();
    const icon = document.getElementById('modal-section-icon').value.trim() || '📌';
    if (!name) return;

    if (editSectionId) {
      const section = this.data.sections.find(s => s.id === editSectionId);
      if (section) {
        section.name = name;
        section.icon = icon;
        section.updatedAt = new Date().toISOString();
      }
    } else {
      const newSec = {
        id: 'sec-' + Date.now(),
        name: name,
        icon: icon,
        collapsed: false,
        updatedAt: new Date().toISOString(),
        projects: [
          { id: 'proj-' + Date.now(), name: 'Основное', icon: '📂', collapsed: false, children: [] }
        ]
      };
      this.data.sections.push(newSec);
    }

    this.saveData();
    this.populateProjectSelects();
    this.renderSidebar();
    this.updateBadges();
    this.renderCurrentView();
    this.closeModal('modal-section');
  },

  deleteSectionFromModal() {
    const editSectionId = document.getElementById('modal-section-edit-id').value;
    if (!editSectionId) return;

    if (this.data.sections.length <= 1) {
      alert('Нельзя удалить единственный оставшийся раздел!');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить весь раздел со всеми его папками, подпапками и задачами?')) {
      if (window.SyncEngine) {
        SyncEngine.recordTombstone(editSectionId, 'section');
        const section = this.data.sections.find(s => s.id === editSectionId);
        if (section && section.projects) {
          const getIds = (list) => {
            let ids = [];
            (list || []).forEach(p => {
              ids.push(p.id);
              if (p.children && p.children.length > 0) ids = ids.concat(getIds(p.children));
            });
            return ids;
          };
          getIds(section.projects).forEach(pId => SyncEngine.recordTombstone(pId, 'project'));
        }
        const deletedTasks = (this.data.tasks || []).filter(t => t.sectionId === editSectionId);
        deletedTasks.forEach(t => SyncEngine.recordTombstone(t.id, 'task'));
        const deletedComp = (this.data.completedTasks || []).filter(t => t.sectionId === editSectionId);
        deletedComp.forEach(t => SyncEngine.recordTombstone(t.id, 'task'));
      }

      this.data.sections = this.data.sections.filter(s => s.id !== editSectionId);
      this.data.tasks = (this.data.tasks || []).filter(t => t.sectionId !== editSectionId);
      this.data.completedTasks = (this.data.completedTasks || []).filter(t => t.sectionId !== editSectionId);

      this.saveData();
      this.populateProjectSelects();
      this.renderSidebar();
      this.updateBadges();
      this.selectView('all');
      this.closeModal('modal-section');

      if (window.SyncEngine && SyncEngine.isConfiguredAndEnabled()) {
        SyncEngine.scheduleAutoSync(500);
      }
    }
  },

  cleanEmptyDuplicateSections() {
    if (!this.data.sections || this.data.sections.length <= 1) {
      alert('Нет разделов для очистки.');
      return;
    }

    const activeTasks = this.data.tasks || [];
    const compTasks = this.data.completedTasks || [];
    const removedSections = [];

    // Подсчитываем имена
    const nameCount = {};
    this.data.sections.forEach(s => {
      const key = s.name.trim().toLowerCase();
      nameCount[key] = (nameCount[key] || 0) + 1;
    });

    const newSections = [];
    this.data.sections.forEach(s => {
      const key = s.name.trim().toLowerCase();
      const secActiveCount = activeTasks.filter(t => t.sectionId === s.id).length;
      const secCompCount = compTasks.filter(t => t.sectionId === s.id).length;

      // Если это дубликат с 0 задач, удаляем его
      if (nameCount[key] > 1 && secActiveCount === 0 && secCompCount === 0) {
        removedSections.push(s);
        nameCount[key]--;
        if (window.SyncEngine) {
          SyncEngine.recordTombstone(s.id, 'section');
          const getIds = (list) => {
            let ids = [];
            (list || []).forEach(p => {
              ids.push(p.id);
              if (p.children && p.children.length > 0) ids = ids.concat(getIds(p.children));
            });
            return ids;
          };
          getIds(s.projects).forEach(pId => SyncEngine.recordTombstone(pId, 'project'));
        }
      } else {
        newSections.push(s);
      }
    });

    if (removedSections.length > 0) {
      this.data.sections = newSections;
      this.saveData();
      this.populateProjectSelects();
      this.renderSidebar();
      this.renderCurrentView();
      this.updateBadges();

      if (window.SyncEngine && SyncEngine.isConfiguredAndEnabled()) {
        SyncEngine.scheduleAutoSync(500);
      }

      alert(`Удалено пустых разделов-дубликатов: ${removedSections.length} (${removedSections.map(s => s.name).join(', ')})`);
    } else {
      alert('Пустых разделов-дубликатов не обнаружено. Вы можете удалить любой ненужный раздел вручную, нажав на карандаш ✏️ рядом с его названием в меню слева.');
    }
  },

  refreshSettingsUI() {
    if (!this.data) return;
    if (!this.data.settings) this.data.settings = {};

    // 1. Звуки
    const soundCheck = document.getElementById('setting-sound-enabled');
    if (soundCheck) soundCheck.checked = this.data.settings.soundEnabled !== false;
    const toneSelect = document.getElementById('setting-sound-tone');
    if (toneSelect) toneSelect.value = this.data.settings.soundTone || 'digital';

    // 2. Подпункты и напоминания
    const subtasksSelect = document.getElementById('setting-default-subtasks');
    if (subtasksSelect) subtasksSelect.value = this.data.settings.defaultSubtasksExpanded || 'collapsed';
    const remArchiveCheck = document.getElementById('setting-reminders-in-archive');
    if (remArchiveCheck) remArchiveCheck.checked = !!this.data.settings.remindersInArchive;

    // 3. Трей и автозапуск
    const trayCheck = document.getElementById('setting-minimize-to-tray');
    if (trayCheck) trayCheck.checked = this.data.settings.minimizeToTray !== false;
    const autostartCheck = document.getElementById('setting-autostart-windows');
    if (autostartCheck) autostartCheck.checked = !!this.data.settings.autostartWindows;

    // 4. Тема оформления
    const currentTheme = localStorage.getItem('planer_theme') || this.data.settings.theme || 'warm';
    document.querySelectorAll('.btn-theme').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-theme-${currentTheme}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 5. Горячие клавиши
    this.renderHotkeySettings();

    // 6. Список баз данных
    this.renderVaultsSettingsList();
  },

  openSettingsModal(defaultTab = 'hotkeys') {
    this.refreshSettingsUI();
    this.switchSettingsTab(defaultTab);
    this.openModal('modal-settings');
  },

  // =========================================================================
  // Cloud sync UI hook (kept provider-agnostic for future providers)
  // =========================================================================
  updateSyncUI(info) {
    const btn = document.getElementById('sidebar-sync-btn');
    const icon = document.getElementById('sidebar-sync-icon');
    const label = document.getElementById('sidebar-sync-label');
    const spinner = document.getElementById('sidebar-sync-spinner');

    if (!btn || !icon || !label) return;

    btn.classList.remove('is-syncing', 'is-success', 'is-error');

    if (!info.isEnabled) {
      icon.textContent = '☁️';
      label.textContent = 'Облако: не настроено';
      if (spinner) spinner.style.display = 'none';
      btn.title = 'Облачный provider пока не подключен';
      return;
    }

    if (info.status === 'syncing') {
      btn.classList.add('is-syncing');
      icon.textContent = '☁️';
      label.textContent = 'Синхронизация...';
      if (spinner) spinner.style.display = 'inline-block';
      btn.title = 'Идет обмен данными с Облаком...';
    } else if (info.status === 'success') {
      btn.classList.add('is-success');
      icon.textContent = '☁️🟢';
      if (spinner) spinner.style.display = 'none';
      const timeDisp = info.lastSyncTime ? new Date(info.lastSyncTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'только что';
      label.textContent = `Облако: ${timeDisp}`;
      btn.title = `Синхронизировано в ${timeDisp}. Нажмите для обновления.`;
    } else if (info.status === 'error') {
      btn.classList.add('is-error');
      icon.textContent = '☁️⚠️';
      label.textContent = 'Облако: Ошибка';
      if (spinner) spinner.style.display = 'none';
      btn.title = `Ошибка синхронизации: ${info.lastError || 'Проверьте сеть или пароль'}`;
    } else {
      icon.textContent = '☁️';
      label.textContent = 'Облако: Готово';
      if (spinner) spinner.style.display = 'none';
    }
  },

  // =========================================================================
  // УПРАВЛЕНИЕ МУЛЬТИ-БАЗАМИ ДАННЫХ (Vaults / Profiles)
  // =========================================================================
  vaultsRegistry: null,
  activeVault: null,

  async initVaults() {
    try {
      const reg = await Storage.getVaultsRegistry();
      this.vaultsRegistry = reg;
      const active = reg.vaults.find(v => v.id === reg.activeVaultId) || reg.vaults[0];
      this.activeVault = active;
      this.renderSidebarVaultBadge();
    } catch (e) {
      console.error('Ошибка инициализации баз данных:', e);
      this.activeVault = { id: 'vault-default', name: 'Основная база', icon: '💼', color: '#4f6ef7' };
      this.renderSidebarVaultBadge();
    }
  },

  renderSidebarVaultBadge() {
    const iconEl = document.getElementById('sidebar-vault-icon');
    const nameEl = document.getElementById('sidebar-vault-name');
    if (iconEl && this.activeVault) iconEl.textContent = this.activeVault.icon || '💼';
    if (nameEl && this.activeVault) nameEl.textContent = this.activeVault.name || 'Основная база';
  },

  async switchVault(vaultId) {
    if (this.activeVault && this.activeVault.id === vaultId) return;

    // Приостанавливаем активные таймеры перед переключением базы и сохраняем
    TimerEngine.pauseAllTasks();
    if (TimerEngine.isBreakRunning()) {
      TimerEngine.stopBreak();
    }
    await Storage.save(this.data);

    const res = await Storage.switchVault(vaultId);
    if (!res || !res.success) {
      alert('Ошибка переключения базы данных: ' + (res?.error || 'Неизвестная ошибка'));
      return;
    }

    this.data = res.data;
    this.activeVault = res.vaultInfo;
    this.normalizeAllData();
    const activeTheme = localStorage.getItem('planer_theme') || this.data.settings?.theme || 'warm';
    this.applyTheme(activeTheme);
    if (this.data.settings) this.data.settings.theme = activeTheme;
    this.renderSidebarVaultBadge();
    this.populateProjectSelects();
    this.renderSidebar();
    this.selectView('all');
    this.updateBadges();

    if (window.SyncEngine) {
      SyncEngine.updateStatus('idle');
      if (SyncEngine.isConfiguredAndEnabled()) {
        SyncEngine.sync({ silent: true });
      }
    }

    this.refreshSettingsUI();
    this.showFloatingNotice(`База переключена: ${this.activeVault.icon} ${this.activeVault.name}`);
  },

  showFloatingNotice(text) {
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-card);
      color: var(--text-main);
      border: 1.5px solid var(--accent-primary);
      box-shadow: var(--shadow-lg);
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.2s ease;
    `;
    notice.innerHTML = `<span>✨</span><span>${this.escapeHtml(text)}</span>`;
    document.body.appendChild(notice);
    setTimeout(() => {
      notice.style.opacity = '0';
      notice.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notice.remove(), 300);
    }, 2500);
  },

  openCreateVaultModal() {
    document.getElementById('modal-vault-edit-title').textContent = '➕ Создать новую базу данных';
    document.getElementById('modal-vault-edit-id').value = '';
    document.getElementById('modal-vault-icon').value = '💼';
    document.getElementById('modal-vault-name').value = '';
    document.getElementById('modal-vault-filepath').value = '';

    const pathGroup = document.getElementById('modal-vault-path-group');
    if (pathGroup) pathGroup.style.display = 'block';

    this.renderEmojiPicker('vault-emoji-grid', 'modal-vault-icon', '');
    this.openModal('modal-create-vault');

    setTimeout(() => {
      const nameInput = document.getElementById('modal-vault-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 60);
  },

  async openEditVaultModal(vaultId) {
    const reg = await Storage.getVaultsRegistry();
    const vault = reg.vaults.find(v => v.id === vaultId);
    if (!vault) return;

    document.getElementById('modal-vault-edit-title').textContent = '✏️ Редактировать базу данных';
    document.getElementById('modal-vault-edit-id').value = vaultId;
    document.getElementById('modal-vault-icon').value = vault.icon || '📁';
    document.getElementById('modal-vault-name').value = vault.name || '';
    document.getElementById('modal-vault-filepath').value = vault.filePath || '';

    const pathGroup = document.getElementById('modal-vault-path-group');
    if (pathGroup) pathGroup.style.display = 'none';

    this.renderEmojiPicker('vault-emoji-grid', 'modal-vault-icon', '');
    this.openModal('modal-create-vault');

    setTimeout(() => {
      const nameInput = document.getElementById('modal-vault-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 60);
  },

  async browseVaultSaveLocation() {
    const name = document.getElementById('modal-vault-name').value.trim() || 'julo_db';
    const cleanName = name.replace(/[^\w\u0400-\u04FF]/gi, '_');
    const res = await Storage.chooseVaultFilePath(cleanName);
    if (res && res.success && res.filePath) {
      document.getElementById('modal-vault-filepath').value = res.filePath;
    }
  },

  async saveVaultModal() {
    const editId = document.getElementById('modal-vault-edit-id').value;
    const icon = document.getElementById('modal-vault-icon').value.trim() || '💼';
    const name = document.getElementById('modal-vault-name').value.trim() || 'Без названия';
    const customFilePath = document.getElementById('modal-vault-filepath').value.trim();

    if (editId) {
      // Редактирование существующей базы
      await Storage.changeVaultMeta({ vaultId: editId, name, icon });
      if (this.activeVault && this.activeVault.id === editId) {
        this.activeVault.name = name;
        this.activeVault.icon = icon;
        this.renderSidebarVaultBadge();
      }
      this.closeModal('modal-create-vault');
      await this.renderVaultsSettingsList();
    } else {
      // Сохраняем текущую базу перед созданием новой
      await Storage.save(this.data);

      // Создание новой базы
      const res = await Storage.createVault({ name, icon, customFilePath });
      if (!res || !res.success) {
        alert('Ошибка создания базы: ' + (res?.error || 'Неизвестная ошибка'));
        return;
      }

      this.closeModal('modal-create-vault');

      this.data = res.data;
      this.activeVault = res.vaultInfo;
      this.normalizeAllData();
      const activeTheme = localStorage.getItem('planer_theme') || this.data.settings?.theme || 'warm';
      this.applyTheme(activeTheme);
      if (this.data.settings) this.data.settings.theme = activeTheme;
      await Storage.save(this.data);
      this.renderSidebarVaultBadge();
      this.populateProjectSelects();
      this.renderSidebar();
      this.selectView('all');
      this.updateBadges();

      this.refreshSettingsUI();
      this.showFloatingNotice(`Создана и открыта база: ${this.activeVault.icon} ${this.activeVault.name}`);
    }
  },

  async openVaultFromFile() {
    const res = await Storage.openVaultFromFile();
    if (!res || res.canceled) return;
    if (!res.success) {
      alert('Ошибка открытия файла: ' + (res.error || 'Не удалось прочитать файл'));
      return;
    }

    this.data = res.data;
    this.activeVault = res.vaultInfo;
    this.normalizeAllData();
    const activeTheme = localStorage.getItem('planer_theme') || this.data.settings?.theme || 'warm';
    this.applyTheme(activeTheme);
    if (this.data.settings) this.data.settings.theme = activeTheme;
    this.renderSidebarVaultBadge();
    this.populateProjectSelects();
    this.renderSidebar();
    this.selectView('all');
    this.updateBadges();

    this.refreshSettingsUI();
    this.showFloatingNotice(`Открыта база из файла: ${this.activeVault.icon} ${this.activeVault.name}`);
  },

  async renderVaultsSettingsList() {
    const listEl = document.getElementById('vaults-settings-list');
    if (!listEl) return;

    const reg = await Storage.getVaultsRegistry();
    this.vaultsRegistry = reg;

    listEl.innerHTML = reg.vaults.map(v => {
      const isActive = v.id === reg.activeVaultId;
      const tasksStr = v.taskCount !== undefined ? ` • ${v.taskCount} активных задач` : '';
      const canDelete = reg.vaults.length > 1;

      return `
        <div class="vault-manager-card ${isActive ? 'active-vault' : ''}">
          <div class="vault-manager-card-top">
            <div class="vault-manager-card-info">
              <span style="font-size: 24px;">${v.icon || '📁'}</span>
              <div>
                <div style="font-weight: 700; font-size: 14.5px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  ${this.escapeHtml(v.name)}
                  ${isActive ? '<span style="font-size: 11px; background: rgba(79, 110, 247, 0.15); color: var(--accent-primary); padding: 2px 8px; border-radius: 12px;">Активна</span>' : ''}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  ${v.exists ? '✅ Файл доступен' : '⚠️ Файл не найден'}${tasksStr}
                </div>
              </div>
            </div>

            <div class="vault-manager-card-actions">
              ${!isActive ? `<button type="button" class="btn-sm btn-primary" onclick="App.switchVault('${v.id}')" style="font-size: 12px; padding: 4px 10px;">Сделать активной</button>` : ''}
              <button type="button" class="btn-sm btn-secondary" onclick="App.openEditVaultModal('${v.id}')" title="Изменить название и иконку" style="font-size: 12px; padding: 4px 8px;">✏️</button>
              <button type="button" class="btn-sm btn-secondary" onclick="App.changeVaultPathFromManager('${v.id}')" title="Сменить путь к файлу на диске" style="font-size: 12px; padding: 4px 8px;">📂 Путь</button>
              ${canDelete ? `<button type="button" class="btn-sm btn-subtle" onclick="App.deleteVaultFromManager('${v.id}')" title="Удалить базу" style="color: #dc2626; font-size: 12px; padding: 4px 8px;">🗑️</button>` : ''}
            </div>
          </div>

          <div class="vault-path-row" title="${this.escapeHtml(v.filePath)}">
            <span style="font-size: 13px;">📁</span>
            <span class="vault-path-text">${this.escapeHtml(v.filePath)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  async changeVaultPathFromManager(vaultId) {
    const reg = await Storage.getVaultsRegistry();
    const vault = reg.vaults.find(v => v.id === vaultId);
    if (!vault) return;

    const res = await Storage.chooseVaultFilePath((vault.name || 'planer_db').replace(/[^\w\u0400-\u04FF]/gi, '_'));
    if (!res || res.canceled || !res.filePath) return;

    const moveRes = await Storage.changeVaultPath({ vaultId, newFilePath: res.filePath });
    if (!moveRes || !moveRes.success) {
      alert('Ошибка изменения пути: ' + (moveRes?.error || 'Не удалось переместить файл'));
      return;
    }

    await this.renderVaultsSettingsList();
    this.showFloatingNotice(`Путь к базе изменен на: ${res.filePath}`);
  },

  async deleteVaultFromManager(vaultId) {
    const reg = await Storage.getVaultsRegistry();
    const vault = reg.vaults.find(v => v.id === vaultId);
    if (!vault) return;

    if (!confirm(`Вы действительно хотите удалить базу "${vault.name}" из списка программы?`)) {
      return;
    }

    const deleteFile = confirm(`Удалить также сам файл базы с диска (${vault.filePath})?\n\nНажмите "ОК" чтобы стереть файл, или "Отмена" чтобы просто убрать базу из меню программы.`);

    const res = await Storage.deleteVault({ vaultId, deleteFileOnDisk: deleteFile });
    if (!res || !res.success) {
      alert('Ошибка удаления базы: ' + (res?.error || 'Не удалось удалить'));
      return;
    }

    if (res.activeSwitched && res.data) {
      this.data = res.data;
      this.activeVault = res.newActiveVault;
      this.normalizeAllData();
      this.renderSidebarVaultBadge();
      this.populateProjectSelects();
      this.renderSidebar();
      this.renderCurrentView();
      this.updateBadges();
    }

    await this.renderVaultsSettingsList();
    this.showFloatingNotice(`База "${vault.name}" удалена`);
  },

  // =========================================================================
  // Вложения, веб-ссылки, локальные файлы и скриншоты (Attachments & Lightbox)
  // =========================================================================
  tempTaskAttachments: [],
  editingAttachmentIndex: null,

  renderModalAttachments() {
    const container = document.getElementById('modal-attachments-container');
    if (!container) return;

    if (!this.tempTaskAttachments || this.tempTaskAttachments.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; padding: 2px 0;">Вложений пока нет. Нажмите кнопки выше или вставьте скриншот из буфера (Ctrl+V).</div>`;
      return;
    }

    let html = '';
    this.tempTaskAttachments.forEach((att, index) => {
      let icon = '📎';
      let title = att.title || '';
      let sub = '';
      let thumb = '';

      if (att.type === 'url') {
        icon = '🌐';
        title = att.title || this.getDomainFromUrl(att.url);
        sub = att.url;
      } else if (att.type === 'path') {
        icon = '📁';
        title = att.title || att.name || 'Папка / Файл';
        sub = att.path;
      } else if (att.type === 'image') {
        icon = '🖼️';
        title = att.title || 'Скриншот / Изображение';
        sub = 'Кликните по миниатюре для просмотра';
        thumb = `<img class="modal-att-thumb-preview" src="${att.dataUrl}" onclick="App.openImageLightbox('${att.dataUrl}', '${this.escapeHtml(title)}')" title="Просмотреть в полный экран">`;
      }

      const cleanPath = (att.path || '').replace(/'/g, "\\'");

      html += `
        <div class="modal-attachment-item">
          ${thumb ? thumb : `<span class="modal-att-icon">${icon}</span>`}
          <div class="modal-att-info">
            <span class="modal-att-title">${this.escapeHtml(title)}</span>
            <span class="modal-att-sub">${this.escapeHtml(sub)}</span>
          </div>
          <div class="modal-att-actions">
            ${att.type === 'url' ? `<button type="button" class="btn-xs btn-subtle" data-url="${this.escapeHtml(att.url)}" onclick="App.openAttachmentUrl(this.dataset.url)" title="Открыть в браузере">🔗 Перейти</button>` : ''}
            ${att.type === 'path' ? `<button type="button" class="btn-xs btn-subtle" onclick="App.openAttachmentPath('${this.escapeHtml(cleanPath)}')" title="Открыть в проводнике">📂</button>` : ''}
            <button type="button" class="btn-xs btn-subtle" onclick="App.editModalAttachment(${index})" title="Редактировать ссылку или название">✏️ Изменить</button>
            <button type="button" class="btn-icon btn-delete" onclick="App.removeModalAttachment(${index})" title="Удалить вложение">🗑</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  removeModalAttachment(index) {
    if (this.tempTaskAttachments && this.tempTaskAttachments[index] !== undefined) {
      this.tempTaskAttachments.splice(index, 1);
      this.renderModalAttachments();
    }
  },

  async editModalAttachment(index) {
    if (!this.tempTaskAttachments || !this.tempTaskAttachments[index]) return;
    const att = this.tempTaskAttachments[index];
    if (att.type === 'url') {
      this.openAddLinkModal(index);
    } else {
      const newTitle = await this.showPrompt('Введите новое название для вложения:', att.title || '');
      if (newTitle !== null && newTitle.trim()) {
        att.title = newTitle.trim();
        this.renderModalAttachments();
      }
    }
  },

  openAddLinkModal(editIndex = null) {
    const urlInput = document.getElementById('link-input-url');
    const titleInput = document.getElementById('link-input-title');
    const statusEl = document.getElementById('link-fetch-status');
    const headingEl = document.getElementById('modal-link-heading');
    const saveBtn = document.getElementById('btn-link-save');

    if (editIndex !== null && this.tempTaskAttachments && this.tempTaskAttachments[editIndex]) {
      this.editingAttachmentIndex = editIndex;
      const att = this.tempTaskAttachments[editIndex];
      if (urlInput) urlInput.value = att.url || '';
      if (titleInput) titleInput.value = att.title || '';
      if (headingEl) headingEl.textContent = 'Редактировать ссылку';
      if (saveBtn) saveBtn.textContent = '💾 Сохранить изменения';
    } else {
      this.editingAttachmentIndex = null;
      if (urlInput) urlInput.value = '';
      if (titleInput) titleInput.value = '';
      if (headingEl) headingEl.textContent = 'Добавить ссылку на сайт';
      if (saveBtn) saveBtn.textContent = '💾 Прикрепить ссылку';
    }

    if (statusEl) statusEl.style.display = 'none';
    this.openModal('modal-add-link');
    setTimeout(() => {
      if (urlInput) urlInput.focus();
    }, 60);
  },

  linkFetchTimer: null,

  onLinkUrlInput(rawUrl) {
    const url = (rawUrl || '').trim();
    if (!url || url.length < 4) return;

    if (this.linkFetchTimer) clearTimeout(this.linkFetchTimer);

    this.linkFetchTimer = setTimeout(async () => {
      let formattedUrl = url;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      try {
        new URL(formattedUrl);
      } catch (e) {
        return;
      }

      const titleInput = document.getElementById('link-input-title');
      const statusEl = document.getElementById('link-fetch-status');
      
      const currentTitle = titleInput?.value.trim();
      const isDefault = !currentTitle || currentTitle === this.getDomainFromUrl(formattedUrl);

      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = '⏳ Определение названия страницы...';
      }

      if (window.electronAPI?.fetchUrlTitle) {
        const res = await window.electronAPI.fetchUrlTitle(formattedUrl);
        if (statusEl) {
          statusEl.style.display = 'none';
        }
        if (res && res.success && res.title) {
          if (titleInput && (isDefault || !titleInput.value.trim())) {
            titleInput.value = res.title;
          }
        }
      }
    }, 350);
  },

  async applyAddLink() {
    let url = document.getElementById('link-input-url')?.value.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    let title = document.getElementById('link-input-title')?.value.trim();

    // Если заголовок еще не заполнен, пытаемся быстро получить через API
    if (!title && window.electronAPI?.fetchUrlTitle) {
      const res = await window.electronAPI.fetchUrlTitle(url);
      if (res && res.success && res.title) {
        title = res.title;
      }
    }

    if (!title) {
      title = this.getDomainFromUrl(url);
    }

    if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];

    if (this.editingAttachmentIndex !== null && this.tempTaskAttachments[this.editingAttachmentIndex]) {
      this.tempTaskAttachments[this.editingAttachmentIndex].url = url;
      this.tempTaskAttachments[this.editingAttachmentIndex].title = title;
      this.tempTaskAttachments[this.editingAttachmentIndex].updatedAt = new Date().toISOString();
      this.editingAttachmentIndex = null;
    } else {
      this.tempTaskAttachments.push({
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        type: 'url',
        title: title,
        url: url,
        createdAt: new Date().toISOString()
      });
    }

    this.closeModal('modal-add-link');
    this.renderModalAttachments();
  },

  async addLocalFolderAttachment() {
    if (window.electronAPI?.selectLocalFolder) {
      const res = await window.electronAPI.selectLocalFolder();
      if (res && res.success && res.path) {
        if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
        this.tempTaskAttachments.push({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          type: 'path',
          title: res.name || 'Папка',
          path: res.path,
          createdAt: new Date().toISOString()
        });
        this.renderModalAttachments();
      }
    }
  },

  async addLocalFileAttachment() {
    if (window.electronAPI?.selectLocalFile) {
      const res = await window.electronAPI.selectLocalFile();
      if (res && res.success && res.path) {
        if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
        this.tempTaskAttachments.push({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          type: 'path',
          title: res.name || 'Файл',
          path: res.path,
          createdAt: new Date().toISOString()
        });
        this.renderModalAttachments();
      }
    }
  },

  async addImageFileAttachment() {
    if (window.electronAPI?.selectImageFile) {
      const res = await window.electronAPI.selectImageFile();
      if (res && res.success && res.dataUrl) {
        const compressed = await this.compressImageDataUrl(res.dataUrl);
        if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
        this.tempTaskAttachments.push({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          type: 'image',
          title: res.name || 'Изображение',
          dataUrl: compressed,
          createdAt: new Date().toISOString()
        });
        this.renderModalAttachments();
      }
    }
  },

  async handlePasteInTaskModal(e) {
    if (!e.clipboardData) return;

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target.result;
            const compressed = await this.compressImageDataUrl(dataUrl);
            if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
            this.tempTaskAttachments.push({
              id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              type: 'image',
              title: 'Скриншот ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              dataUrl: compressed,
              createdAt: new Date().toISOString()
            });
            this.renderModalAttachments();
            if (this.data.settings?.soundEnabled) {
              this.playTone('digital');
            }
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  },

  async handleDroppedFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const compressed = await this.compressImageDataUrl(event.target.result);
          if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
          this.tempTaskAttachments.push({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            type: 'image',
            title: file.name || 'Изображение',
            dataUrl: compressed,
            createdAt: new Date().toISOString()
          });
          this.renderModalAttachments();
        };
        reader.readAsDataURL(file);
      } else if (file.path) {
        if (!Array.isArray(this.tempTaskAttachments)) this.tempTaskAttachments = [];
        this.tempTaskAttachments.push({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          type: 'path',
          title: file.name || 'Файл',
          path: file.path,
          createdAt: new Date().toISOString()
        });
        this.renderModalAttachments();
      }
    }
  },

  compressImageDataUrl(dataUrl, maxDim = 1280, quality = 0.85) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  },

  openAttachmentUrl(url) {
    if (!url || typeof url !== 'string') return;
    let target = url.trim();
    if (!target) return;
    if (!/^https?:\/\//i.test(target) && !/^mailto:/i.test(target)) {
      target = 'https://' + target;
    }
    if (window.electronAPI?.openExternalUrl) {
      window.electronAPI.openExternalUrl(target);
    } else {
      window.open(target, '_blank');
    }
  },

  openAttachmentPath(itemPath) {
    if (!itemPath) return;
    if (window.electronAPI?.openLocalPath) {
      window.electronAPI.openLocalPath(itemPath);
    }
  },

  openImageLightbox(src, title) {
    const modal = document.getElementById('modal-image-lightbox');
    const imgEl = document.getElementById('lightbox-image-src');
    const titleEl = document.getElementById('lightbox-image-title');
    if (modal && imgEl) {
      imgEl.src = src;
      if (titleEl) titleEl.textContent = title || '🖼️ Просмотр скриншота';
      modal.style.display = 'flex';
    }
  },

  closeImageLightbox() {
    const modal = document.getElementById('modal-image-lightbox');
    if (modal) modal.style.display = 'none';
  },

  async copyLightboxImageToClipboard() {
    const imgEl = document.getElementById('lightbox-image-src');
    if (!imgEl || !imgEl.src) return;
    try {
      const response = await fetch(imgEl.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert('Изображение скопировано в буфер обмена!');
    } catch (err) {
      console.error('Ошибка копирования изображения:', err);
    }
  },

  downloadLightboxImage() {
    const imgEl = document.getElementById('lightbox-image-src');
    if (!imgEl || !imgEl.src) return;
    const a = document.createElement('a');
    a.href = imgEl.src;
    a.download = `planer-screenshot-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  getDomainFromUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      return url || 'Ссылка';
    }
  },

  // =========================================================================
  // Полнотекстовый редактор «📖 Открыть заметку» (Rich Notes & Docs)
  // =========================================================================
  currentNoteTaskId: null,
  noteAutoSaveTimer: null,
  isNoteFullscreen: false,

  openTaskNoteModal(taskId) {
    if (!taskId) return;
    this.currentNoteTaskId = taskId;
    const task = this.data.tasks.find(t => t.id === taskId) || this.data.completedTasks.find(t => t.id === taskId);
    if (!task) return;

    const titleEl = document.getElementById('modal-note-task-title');
    const statusEl = document.getElementById('modal-note-save-status');
    const editor = document.getElementById('task-note-editor');
    const headingSelect = document.getElementById('note-heading-select');

    if (titleEl) titleEl.textContent = task.title || 'Заметка к задаче';
    if (statusEl) statusEl.textContent = '💾 Сохранено';
    if (headingSelect) headingSelect.value = 'p';

    if (editor) {
      editor.innerHTML = this.sanitizeHtml(task.noteHtml || '');
      this.ensureNoteBlockDeleteButtons();
      
      // Переназначаем слушатели
      editor.oninput = () => {
        this.ensureNoteBlockDeleteButtons();
        this.saveTaskNote(false);
      };

      editor.onclick = (e) => {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href') || link.href;
          if (href) {
            e.preventDefault();
            this.openAttachmentUrl(href);
            return;
          }
        }
        const hr = e.target.closest('hr');
        const img = e.target.closest('img');
        if (hr) {
          this.selectNoteHr(hr);
        } else if (img) {
          this.selectNoteImg(img);
        } else {
          this.selectNoteHr(null);
          this.selectNoteImg(null);
        }
      };

      editor.onpaste = (e) => {
        this.handleNotePaste(e);
      };

      editor.onkeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.saveTaskNote(true);
          return;
        } else if (e.key === 'Tab') {
          e.preventDefault();
          document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
          return;
        }

        // 1. Умное удаление (Backspace / Delete) блоков: цитаты, важно, разделители, чек-листы, картинки
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const selectedHr = editor.querySelector('hr.selected-hr');
          if (selectedHr) {
            e.preventDefault();
            selectedHr.remove();
            this.saveTaskNote(false);
            return;
          }

          const selectedImg = editor.querySelector('img.selected-img');
          if (selectedImg) {
            e.preventDefault();
            selectedImg.remove();
            this.saveTaskNote(false);
            return;
          }

          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            let node = range.startContainer;
            let block = null;
            while (node && node !== editor) {
              if (
                node.nodeName === 'BLOCKQUOTE' ||
                (node.classList && node.classList.contains('note-callout')) ||
                (node.classList && node.classList.contains('note-todo-item')) ||
                ['H1', 'H2', 'H3'].includes(node.nodeName)
              ) {
                block = node;
                break;
              }
              node = node.parentNode;
            }

            // А. Удаление Цитаты (BLOCKQUOTE)
            if (block && block.nodeName === 'BLOCKQUOTE') {
              const text = (block.innerText || '').replace(/✕/g, '').replace(/\u00a0/g, ' ').trim();
              const isEntirelySelected = !sel.isCollapsed && sel.toString().trim() === text;
              const isAtStart = (range.startOffset === 0 && (range.startContainer === block || range.startContainer === block.firstChild));

              if (text === '' || isEntirelySelected || (isAtStart && e.key === 'Backspace')) {
                e.preventDefault();
                const p = document.createElement('p');
                p.innerHTML = (!isEntirelySelected && text.length > 0) ? block.innerHTML : '<br>';
                p.querySelectorAll('.note-block-del-btn').forEach(b => b.remove());
                block.parentNode.replaceChild(p, block);
                const newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                this.saveTaskNote(false);
                return;
              }
            }

            // Б. Удаление блока «Важно / Совет» (note-callout)
            if (block && block.classList && block.classList.contains('note-callout')) {
              const fullText = (block.innerText || '').replace(/^[💡ℹ️⚠️📌\s]+/g, '').replace(/✕/g, '').replace(/\u00a0/g, ' ').trim();
              const isEntirelySelected = !sel.isCollapsed && (sel.toString().trim() === fullText || sel.toString().length > Math.max(0, fullText.length - 8));
              const isAtStart = (range.startOffset === 0);

              if (fullText === '' || fullText === 'Важная деталь / Совет:' || isEntirelySelected || (isAtStart && e.key === 'Backspace' && fullText.length <= 25)) {
                e.preventDefault();
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                block.parentNode.replaceChild(p, block);
                const newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                this.saveTaskNote(false);
                return;
              }
            }

            // В. Удаление чек-листа (note-todo-item)
            if (block && block.classList && block.classList.contains('note-todo-item')) {
              const text = (block.innerText || '').replace(/✕/g, '').trim();
              if (text === '' || (range.startOffset === 0 && e.key === 'Backspace')) {
                e.preventDefault();
                const p = document.createElement('p');
                p.innerHTML = text ? text : '<br>';
                block.parentNode.replaceChild(p, block);
                const newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                this.saveTaskNote(false);
                return;
              }
            }

            // Г. Заголовки (H1-H3)
            if (block && ['H1', 'H2', 'H3'].includes(block.nodeName)) {
              const text = (block.innerText || '').trim();
              if (text === '' && e.key === 'Backspace') {
                e.preventDefault();
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                block.parentNode.replaceChild(p, block);
                const headingSelect = document.getElementById('note-heading-select');
                if (headingSelect) headingSelect.value = 'p';
                const newRange = document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                this.saveTaskNote(false);
                return;
              }
            }

            // Д. Удаление разделителя <hr>
            if (e.key === 'Backspace' && range.startOffset === 0) {
              let curBlock = range.startContainer;
              while (curBlock && curBlock.parentNode !== editor) {
                curBlock = curBlock.parentNode;
              }
              if (curBlock && curBlock.previousElementSibling && curBlock.previousElementSibling.tagName === 'HR') {
                e.preventDefault();
                curBlock.previousElementSibling.remove();
                this.saveTaskNote(false);
                return;
              }
            }

            if (e.key === 'Delete') {
              let curBlock = range.startContainer;
              while (curBlock && curBlock.parentNode !== editor) {
                curBlock = curBlock.parentNode;
              }
              if (curBlock && curBlock.nextElementSibling && curBlock.nextElementSibling.tagName === 'HR') {
                e.preventDefault();
                curBlock.nextElementSibling.remove();
                this.saveTaskNote(false);
                return;
              }
            }
          }
        }

        // 2. Умный переход на следующую строку из цитаты (blockquote) и блока «Важно» (note-callout)
        if (e.key === 'Enter') {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            let node = range.startContainer;
            let block = null;
            while (node && node !== editor) {
              if (node.nodeName === 'BLOCKQUOTE' || (node.classList && node.classList.contains('note-callout'))) {
                block = node;
                break;
              }
              node = node.parentNode;
            }

            if (block) {
              if (e.shiftKey) {
                // Shift+Enter: перенос строки внутри блока
                e.preventDefault();
                document.execCommand('insertLineBreak');
                return;
              }

              // Обычный Enter: выход из блока в новый стандартный абзац ниже
              e.preventDefault();
              const p = document.createElement('p');
              p.innerHTML = '<br>';
              if (block.nextSibling) {
                block.parentNode.insertBefore(p, block.nextSibling);
              } else {
                block.parentNode.appendChild(p);
              }

              const newRange = document.createRange();
              newRange.setStart(p, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
              this.saveTaskNote(false);
              return;
            }
          }
        }

        // Стрелка вниз: если после блока нет абзаца, создаем его для удобного клика/перехода
        if (e.key === 'ArrowDown') {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            let node = range.startContainer;
            let block = null;
            while (node && node !== editor) {
              if (node.nodeName === 'BLOCKQUOTE' || (node.classList && node.classList.contains('note-callout'))) {
                block = node;
                break;
              }
              node = node.parentNode;
            }

            if (block && !block.nextSibling) {
              const p = document.createElement('p');
              p.innerHTML = '<br>';
              block.parentNode.appendChild(p);
            }
          }
        }
      };
    }

    this.closeNotePopovers();
    this.openModal('modal-task-note');
    setTimeout(() => {
      if (editor) {
        editor.focus();
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editor);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
      }
    }, 40);
  },

  openTaskNoteFromEditModal() {
    const taskId = document.getElementById('modal-task-edit-id')?.value;
    if (taskId) {
      // Сохраняем текущие изменения в модальном окне редактирования задачи
      this.saveTaskModal();
      // Открываем окно заметок
      setTimeout(() => {
        this.openTaskNoteModal(taskId);
      }, 50);
    }
  },

  closeTaskNoteModal() {
    this.saveTaskNote(true);
    this.closeNotePopovers();
    this.closeModal('modal-task-note');
    this.currentNoteTaskId = null;
    this.renderCurrentView();
  },

  deleteCurrentTaskNote() {
    if (!this.currentNoteTaskId) return;

    if (!confirm('Вы уверены, что хотите удалить эту заметку? Весь текст, инструкции и фото заметки будут удалены.')) {
      return;
    }

    if (this.noteAutoSaveTimer) {
      clearTimeout(this.noteAutoSaveTimer);
      this.noteAutoSaveTimer = null;
    }

    const task = this.data.tasks.find(t => t.id === this.currentNoteTaskId) || 
                 this.data.completedTasks.find(t => t.id === this.currentNoteTaskId);

    if (task) {
      task.noteHtml = '';
      task.noteText = '';
      task.updatedAt = new Date().toISOString();
      this.saveData();
    }

    const editor = document.getElementById('task-note-editor');
    if (editor) editor.innerHTML = '';

    this.closeNotePopovers();
    this.closeModal('modal-task-note');
    this.currentNoteTaskId = null;
    this.renderCurrentView();
  },

  saveTaskNote(immediate = false) {
    if (!this.currentNoteTaskId) return;

    const statusEl = document.getElementById('modal-note-save-status');
    if (statusEl) statusEl.textContent = '⏳ Сохранение...';

    if (this.noteAutoSaveTimer) {
      clearTimeout(this.noteAutoSaveTimer);
      this.noteAutoSaveTimer = null;
    }

    const doSave = () => {
      const editor = document.getElementById('task-note-editor');
      if (!editor) return;

      // Очищаем временные кнопки удаления и классы выделения перед сохранением в базу данных
      const clone = editor.cloneNode(true);
      clone.querySelectorAll('.note-block-del-btn').forEach(btn => btn.remove());
      clone.querySelectorAll('.selected-hr').forEach(el => el.classList.remove('selected-hr'));
      clone.querySelectorAll('.selected-img').forEach(el => el.classList.remove('selected-img'));
      const html = clone.innerHTML;
      const text = editor.innerText.replace(/✕/g, '').trim();

      const task = this.data.tasks.find(t => t.id === this.currentNoteTaskId) || 
                   this.data.completedTasks.find(t => t.id === this.currentNoteTaskId);

      if (task) {
        task.noteHtml = this.sanitizeHtml(html);
        task.noteText = text;
        task.updatedAt = new Date().toISOString();
        this.saveData();

        if (statusEl) {
          const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          statusEl.textContent = `💾 Сохранено (${timeStr})`;
        }
      }
    };

    if (immediate) {
      doSave();
    } else {
      this.noteAutoSaveTimer = setTimeout(doSave, 350);
    }
  },

  deleteNoteBlock(target) {
    const editor = document.getElementById('task-note-editor');
    if (!editor || !target) return;

    let block = target;
    if (block.classList && block.classList.contains('note-block-del-btn')) {
      block = block.closest('blockquote, .note-callout, .note-todo-item, hr, img');
    }

    if (block && editor.contains(block)) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      block.parentNode.insertBefore(p, block);
      block.remove();

      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        p.focus();
      } catch (e) {}

      this.saveTaskNote(false);
    }
  },

  selectNoteHr(hr) {
    const editor = document.getElementById('task-note-editor');
    if (!editor) return;
    editor.querySelectorAll('.selected-hr').forEach(el => el.classList.remove('selected-hr'));
    editor.querySelectorAll('.selected-img').forEach(el => el.classList.remove('selected-img'));
    if (hr) {
      hr.classList.add('selected-hr');
    }
  },

  selectNoteImg(img) {
    const editor = document.getElementById('task-note-editor');
    if (!editor) return;
    editor.querySelectorAll('.selected-hr').forEach(el => el.classList.remove('selected-hr'));
    editor.querySelectorAll('.selected-img').forEach(el => el.classList.remove('selected-img'));
    if (img) {
      img.classList.add('selected-img');
    }
  },

  ensureNoteBlockDeleteButtons() {
    const editor = document.getElementById('task-note-editor');
    if (!editor) return;

    editor.querySelectorAll('blockquote, .note-callout, .note-todo-item').forEach(block => {
      if (!block.querySelector('.note-block-del-btn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'note-block-del-btn';
        btn.setAttribute('contenteditable', 'false');
        btn.title = 'Удалить этот блок (✕)';
        btn.textContent = '✕';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          App.deleteNoteBlock(btn);
        };
        block.appendChild(btn);
      }
    });

    editor.querySelectorAll('hr').forEach(hr => {
      hr.title = 'Разделитель (кликните для выделения и удаления клавишей Backspace)';
    });

    editor.querySelectorAll('img').forEach(img => {
      img.title = 'Изображение (кликните для выделения и удаления клавишей Backspace)';
    });
  },

  insertNoteDivider() {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    const html = `<hr><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    this.ensureNoteBlockDeleteButtons();
    this.saveTaskNote(false);
  },

  execNoteCommand(command, value = null) {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    document.execCommand(command, false, value);
    this.saveTaskNote(false);
  },

  applyNoteHeading(tag) {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    if (tag === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    this.saveTaskNote(false);
  },

  closeNotePopovers() {
    const colorPop = document.getElementById('note-color-palette');
    const hlPop = document.getElementById('note-highlight-palette');
    const emojiPop = document.getElementById('note-emoji-palette');
    if (colorPop) colorPop.style.display = 'none';
    if (hlPop) hlPop.style.display = 'none';
    if (emojiPop) emojiPop.style.display = 'none';
  },

  toggleNoteColorPalette(e) {
    if (e) e.stopPropagation();
    const pop = document.getElementById('note-color-palette');
    if (!pop) return;
    const isShown = pop.style.display === 'block';
    this.closeNotePopovers();
    if (!isShown) pop.style.display = 'block';
  },

  applyNoteTextColor(color) {
    this.execNoteCommand('foreColor', color);
    this.closeNotePopovers();
  },

  toggleNoteHighlightPalette(e) {
    if (e) e.stopPropagation();
    const pop = document.getElementById('note-highlight-palette');
    if (!pop) return;
    const isShown = pop.style.display === 'block';
    this.closeNotePopovers();
    if (!isShown) pop.style.display = 'block';
  },

  applyNoteHighlight(color) {
    if (color === 'transparent') {
      this.execNoteCommand('removeFormat');
    } else {
      this.execNoteCommand('hiliteColor', color);
    }
    this.closeNotePopovers();
  },

  toggleNoteEmojiPicker(e) {
    if (e) e.stopPropagation();
    const pop = document.getElementById('note-emoji-palette');
    if (!pop) return;
    const isShown = pop.style.display === 'block';
    this.closeNotePopovers();
    if (!isShown) pop.style.display = 'block';
  },

  insertNoteEmoji(emoji) {
    this.execNoteCommand('insertText', emoji);
    this.closeNotePopovers();
  },

  async insertNoteLinkPrompt() {
    const url = await this.showPrompt('Введите адрес веб-ссылки (URL):', 'https://');
    if (url && url.trim() && url !== 'https://') {
      this.execNoteCommand('createLink', url.trim());
    }
  },

  insertNoteCallout() {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    const sel = window.getSelection();
    let selectedText = '';
    if (sel && sel.rangeCount > 0) {
      selectedText = sel.toString().trim();
    }
    const innerText = selectedText || 'Введите текст инструкции или регламента...';
    const html = `<div class="note-callout">💡 <div><b>Важная деталь / Совет:</b> ${this.escapeHtml(innerText)}</div></div><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    this.ensureNoteBlockDeleteButtons();
    this.saveTaskNote(false);
  },

  insertNoteQuote() {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    const sel = window.getSelection();
    let selectedText = '';
    if (sel && sel.rangeCount > 0) {
      selectedText = sel.toString().trim();
    }
    const quoteText = selectedText || 'Введите текст цитаты...';
    const html = `<blockquote>${this.escapeHtml(quoteText)}</blockquote><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    this.ensureNoteBlockDeleteButtons();
    this.saveTaskNote(false);
  },

  insertNoteTodoItem() {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    const html = `<div class="note-todo-item"><input type="checkbox" onchange="App.saveTaskNote(true)"> <span>Новый пункт чек-листа...</span></div>`;
    document.execCommand('insertHTML', false, html);
    this.ensureNoteBlockDeleteButtons();
    this.saveTaskNote(false);
  },

  triggerNoteImageUpload() {
    document.getElementById('note-file-input')?.click();
  },

  async onNoteFileSelected(e) {
    const files = e.target?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target.result;
          const compressed = await this.compressImageDataUrl(dataUrl);
          this.insertNoteImage(compressed);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  },

  async handleNotePaste(e) {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target.result;
            const compressed = await this.compressImageDataUrl(dataUrl);
            this.insertNoteImage(compressed);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  },

  insertNoteImage(dataUrl) {
    const editor = document.getElementById('task-note-editor');
    if (editor) editor.focus();
    const html = `<img src="${dataUrl}" alt="Изображение" style="max-width: 100%; border-radius: 8px; margin: 12px 0;"><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    this.ensureNoteBlockDeleteButtons();
    this.saveTaskNote(false);
  },

  toggleNoteFullscreen() {
    const card = document.getElementById('modal-note-card');
    const btn = document.getElementById('btn-note-fullscreen');
    if (card) {
      this.isNoteFullscreen = !this.isNoteFullscreen;
      card.classList.toggle('fullscreen', this.isNoteFullscreen);
      if (btn) {
        btn.textContent = this.isNoteFullscreen ? '🗗' : '⛶';
        btn.title = this.isNoteFullscreen ? 'Выйти из полноэкранного режима' : 'Развернуть на весь экран';
      }
    }
  },

  copyNoteText() {
    const editor = document.getElementById('task-note-editor');
    if (!editor) return;
    const text = editor.innerText.trim();
    if (!text) {
      alert('Заметка пуста.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('📋 Текст заметки скопирован в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать.');
    });
  },

  printTaskNote() {
    const editor = document.getElementById('task-note-editor');
    const titleEl = document.getElementById('modal-note-task-title');
    if (!editor) return;

    const title = titleEl ? titleEl.textContent : 'Заметка к задаче';
    const content = editor.innerHTML;

    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            img { max-width: 100%; border-radius: 6px; }
            blockquote { border-left: 4px solid #b45309; padding: 8px 16px; background: #f8fafc; margin: 16px 0; }
            .note-callout { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div>${content}</div>
        </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 250);
    }
  },

  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.style.display = 'flex';
      const reminderPop = document.getElementById('reminder-popover');
      if (reminderPop) reminderPop.classList.remove('show');
      const colorPop = document.getElementById('new-task-color-menu');
      if (colorPop) colorPop.classList.remove('show');
      const vaultsMenu = document.getElementById('vaults-dropdown-menu');
      if (vaultsMenu) vaultsMenu.style.display = 'none';
      if (typeof this.closeNotePopovers === 'function') this.closeNotePopovers();
    }
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.style.display = 'none';
  },

  promptModalResolve: null,

  showPrompt(title, defaultValue = '') {
    return new Promise(resolve => {
      this.promptModalResolve = resolve;
      const titleEl = document.getElementById('modal-prompt-title');
      const inputEl = document.getElementById('modal-prompt-input');
      if (titleEl) titleEl.textContent = title || 'Ввод значения';
      if (inputEl) inputEl.value = defaultValue !== undefined ? defaultValue : '';
      this.openModal('modal-prompt');
      setTimeout(() => {
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 50);
    });
  },

  confirmPromptModal() {
    const inputEl = document.getElementById('modal-prompt-input');
    const val = inputEl ? inputEl.value : '';
    this.closeModal('modal-prompt');
    if (this.promptModalResolve) {
      const res = this.promptModalResolve;
      this.promptModalResolve = null;
      res(val);
    }
  },

  cancelPromptModal() {
    this.closeModal('modal-prompt');
    if (this.promptModalResolve) {
      const res = this.promptModalResolve;
      this.promptModalResolve = null;
      res(null);
    }
  },

  async exportBackup() {
    const res = await Storage.exportBackup(this.data);
    if (res && res.success) {
      alert('Резервная копия успешно сохранена!');
    }
  },

  async importBackup() {
    const res = await Storage.importBackup();
    if (res && res.success && res.data) {
      this.data = res.data;
      this.normalizeAllData();
      this.saveData();
      this.renderSidebar();
      this.populateProjectSelects();
      this.renderCurrentView();
      alert('Данные успешно загружены из резервной копии!');
      this.closeModal('modal-settings');
    }
  },

  async openBackupFolder() {
    await Storage.openBackupFolder();
  },

  // =========================================================================
  // Автономные напоминания и будильники (Reminders System)
  // =========================================================================
  remindersCurrentTab: 'active', // 'active' | 'today' | 'history'
  newReminderSelectedDate: 'today',

  formatRepeatName(code) {
    switch (code) {
      case 'daily': return 'Каждый день';
      case 'weekdays': return 'По будням (Пн-Пт)';
      case 'weekly': return 'Раз в неделю';
      case 'monthly': return 'Раз в месяц';
      case 'yearly': return 'Раз в год';
      default: return 'Однократно';
    }
  },

  setRemindersTab(tab) {
    this.remindersCurrentTab = tab;
    ['active', 'today', 'history'].forEach(t => {
      const btn = document.getElementById(`reminders-tab-${t}`);
      if (btn) {
        if (t === tab) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    this.renderRemindersView();
  },

  setNewReminderDate(type) {
    this.newReminderSelectedDate = type;
    document.querySelectorAll('.reminder-date-chip').forEach(c => c.classList.remove('active'));

    const customDateInput = document.getElementById('new-reminder-custom-date');

    if (type === 'today') {
      document.getElementById('reminder-chip-today')?.classList.add('active');
      if (customDateInput) customDateInput.value = this.getLocalDateStr();
    } else if (type === 'tomorrow') {
      document.getElementById('reminder-chip-tomorrow')?.classList.add('active');
      if (customDateInput) customDateInput.value = this.getLocalDatePlusDays(1);
    }
  },

  onNewReminderCustomDateChange(val) {
    document.querySelectorAll('.reminder-date-chip').forEach(c => c.classList.remove('active'));
    this.newReminderSelectedDate = val ? 'custom' : 'today';
    if (!val) {
      document.getElementById('reminder-chip-today')?.classList.add('active');
    }
  },

  toggleNewReminderTime(checked) {
    const box = document.getElementById('new-reminder-time-box');
    if (box) box.style.display = checked ? 'flex' : 'none';
    const advGroup = document.getElementById('new-reminder-advance-group');
    if (advGroup) advGroup.style.display = checked ? 'flex' : 'none';
  },

  toggleModalReminderTime(checked) {
    const timeWrap = document.getElementById('modal-reminder-time-wrap');
    if (timeWrap) timeWrap.style.display = checked ? 'flex' : 'none';
    const advWrap = document.getElementById('modal-reminder-advance-wrap');
    if (advWrap) advWrap.style.display = checked ? 'flex' : 'none';
  },

  setNewReminderTime(timeStr) {
    const input = document.getElementById('new-reminder-time');
    if (input) input.value = timeStr;
  },

  focusNewReminderInput() {
    const input = document.getElementById('new-reminder-text');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  addNewReminder() {
    const input = document.getElementById('new-reminder-text');
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
      input.focus();
      input.classList.add('input-attention');
      input.placeholder = '⚠️ Напишите сюда текст напоминания...';
      setTimeout(() => {
        input.classList.remove('input-attention');
        input.placeholder = 'О чем напомнить? (например: Позвонить врачу, Выпить витамины, Забрать заказ...)';
      }, 2500);
      return;
    }

    let dueDate = this.getLocalDateStr();
    const customDateVal = document.getElementById('new-reminder-custom-date')?.value;
    if (this.newReminderSelectedDate === 'today') {
      dueDate = this.getLocalDateStr();
    } else if (this.newReminderSelectedDate === 'tomorrow') {
      dueDate = this.getLocalDatePlusDays(1);
    } else if (customDateVal) {
      dueDate = customDateVal;
    }

    const hasTime = !!document.getElementById('new-reminder-has-time')?.checked;
    const timeVal = hasTime ? (document.getElementById('new-reminder-time')?.value || this.getDefaultFutureTimeStr()) : null;
    const dateTime = hasTime ? `${dueDate}T${timeVal}:00` : null;
    const advanceMinutes = hasTime ? (parseInt(document.getElementById('new-reminder-advance')?.value, 10) || 0) : 0;
    const advanceAlsoExact = hasTime ? (document.getElementById('new-reminder-advance-also-exact')?.checked !== false) : true;
    const repeatVal = document.getElementById('new-reminder-repeat')?.value || 'none';

    const newReminder = {
      id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      text: text,
      dueDate: dueDate,
      hasTime: hasTime,
      time: timeVal,
      dateTime: dateTime,
      advanceMinutes: advanceMinutes,
      advanceAlsoExact: advanceAlsoExact,
      advanceNotified: false,
      repeat: repeatVal,
      color: '#3b82f6',
      completed: false,
      notified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!Array.isArray(this.data.reminders)) {
      this.data.reminders = [];
    }

    this.data.reminders.unshift(newReminder);
    this.saveData();

    if (this.data.settings?.soundEnabled) {
      this.playTone('digital');
    }

    input.value = '';
    const advSelect = document.getElementById('new-reminder-advance');
    if (advSelect) advSelect.value = '0';
    const advAlsoExactCheck = document.getElementById('new-reminder-advance-also-exact');
    if (advAlsoExactCheck) advAlsoExactCheck.checked = true;

    this.setNewReminderDate('today');
    this.renderRemindersView();
    this.updateBadges();
    input.focus();
  },

  renderRemindersView() {
    const container = document.getElementById('reminders-list');
    const emptyState = document.getElementById('reminders-empty-state');
    const emptyTitle = document.getElementById('reminders-empty-title');
    if (!container) return;

    const todayStr = this.getLocalDateStr();
    const allReminders = this.data.reminders || [];
    const tab = this.remindersCurrentTab || 'active';

    let items = [];

    if (tab === 'active') {
      items = allReminders.filter(r => !r.completed);
    } else if (tab === 'today') {
      items = allReminders.filter(r => !r.completed && r.dueDate === todayStr);
    } else if (tab === 'history') {
      items = allReminders.filter(r => r.completed);
    }

    // Сортировка: активные по возрастанию даты/времени, история по убыванию даты выполнения
    if (tab === 'history') {
      items.sort((a, b) => new Date(b.completedAt || b.updatedAt || 0) - new Date(a.completedAt || a.updatedAt || 0));
    } else {
      items.sort((a, b) => {
        const dateA = a.dueDate || (a.dateTime ? a.dateTime.slice(0, 10) : '9999');
        const dateB = b.dueDate || (b.dateTime ? b.dateTime.slice(0, 10) : '9999');
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        return timeA.localeCompare(timeB);
      });
    }

    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'flex';
        if (emptyTitle) {
          if (tab === 'today') emptyTitle.textContent = 'На сегодня напоминаний нет';
          else if (tab === 'history') emptyTitle.textContent = 'История завершенных напоминаний пуста';
          else emptyTitle.textContent = 'Активных напоминаний нет';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const now = new Date();
    const nowTime = now.getTime();

    let html = '';
    items.forEach(rem => {
      const isCompleted = !!rem.completed;
      const remDateStr = rem.dueDate || (rem.dateTime ? rem.dateTime.slice(0, 10) : todayStr);
      const hasTime = !!(rem.hasTime && rem.time);
      const remTimeStr = rem.time || '12:00';
      
      const isToday = remDateStr === todayStr;
      const isTomorrow = remDateStr === this.getLocalDatePlusDays(1);
      const isPastDate = remDateStr < todayStr;

      let badgeClass = 'reminder-time-badge is-upcoming';
      let badgeText = `📅 ${remDateStr}`;

      if (isCompleted) {
        badgeClass = 'reminder-time-badge';
        badgeText = hasTime ? `✓ Завершено (${remDateStr} ${remTimeStr})` : `✓ Завершено (${remDateStr})`;
      } else if (hasTime) {
        const advSuffix = (rem.advanceMinutes > 0) ? ` (${this.formatAdvanceMinutesShort(rem.advanceMinutes)})` : '';
        const remTimestamp = new Date(`${remDateStr}T${remTimeStr}:00`).getTime();
        const isPast = nowTime > remTimestamp;
        if (isPast) {
          badgeClass = 'reminder-time-badge is-overdue';
          badgeText = `⚠️ Просрочено: ${remDateStr} в ${remTimeStr}`;
        } else if (isToday) {
          badgeClass = 'reminder-time-badge is-today';
          const diffHours = Math.round((remTimestamp - nowTime) / (1000 * 60 * 60));
          if (diffHours <= 1) {
            const diffMins = Math.max(1, Math.round((remTimestamp - nowTime) / (1000 * 60)));
            badgeText = `🔥 Сегодня в ${remTimeStr}${advSuffix} (через ${diffMins} мин)`;
          } else {
            badgeText = `🔥 Сегодня в ${remTimeStr}${advSuffix} (через ${diffHours} ч)`;
          }
        } else if (isTomorrow) {
          badgeClass = 'reminder-time-badge is-upcoming';
          badgeText = `📅 Завтра в ${remTimeStr}${advSuffix}`;
        } else {
          badgeText = `📅 ${remDateStr} в ${remTimeStr}${advSuffix}`;
        }
      } else {
        // Напоминание без точного времени (памятка на весь день)
        if (isToday) {
          badgeClass = 'reminder-time-badge is-today';
          badgeText = `🔥 Сегодня (в течение дня)`;
        } else if (isTomorrow) {
          badgeClass = 'reminder-time-badge is-upcoming';
          badgeText = `📅 Завтра (в течение дня)`;
        } else if (isPastDate) {
          badgeClass = 'reminder-time-badge is-overdue';
          badgeText = `⚠️ Прошедшая дата: ${remDateStr}`;
        } else {
          badgeClass = 'reminder-time-badge is-upcoming';
          badgeText = `📅 ${remDateStr} (в течение дня)`;
        }
      }

      const repeatBadge = (rem.repeat && rem.repeat !== 'none') 
        ? `<span class="reminder-repeat-badge">🔁 ${this.formatRepeatName(rem.repeat)}</span>` 
        : '';

      const advanceBadge = (!isCompleted && hasTime && rem.advanceMinutes > 0)
        ? `<span class="reminder-advance-badge" title="Опережающий сигнал за ${this.formatAdvanceMinutes(rem.advanceMinutes)}">⏳ Сигнал ${this.formatAdvanceMinutesShort(rem.advanceMinutes)}</span>`
        : '';

      const colorStyle = rem.color ? `border-left: 4px solid ${rem.color};` : 'border-left: 4px solid var(--accent-primary);';

      html += `
        <div class="reminder-card ${isCompleted ? 'is-completed' : ''}" style="${colorStyle}">
          <div class="reminder-main-content">
            <button type="button" class="reminder-check-btn" onclick="App.toggleReminderStatus('${rem.id}')" title="${isCompleted ? 'Вернуть в активные' : 'Отметить как выполненное'}">
              ✓
            </button>
            <div class="reminder-info">
              <div class="reminder-title">${this.escapeHtml(rem.text)}</div>
              <div class="reminder-meta-row">
                <span class="${badgeClass}">${badgeText}</span>
                ${advanceBadge}
                ${repeatBadge}
              </div>
            </div>
          </div>

          <div class="reminder-actions">
            ${(!isCompleted && hasTime) ? `
              <button class="btn-subtle" style="font-size: 11.5px; padding: 4px 8px;" onclick="App.snoozeReminderQuick('${rem.id}', 15)" title="Отложить на 15 минут">
                ⏰ +15 мин
              </button>
            ` : ''}
            <button class="btn-icon" onclick="App.openEditReminderModal('${rem.id}')" title="Редактировать">
              ✏️
            </button>
            <button class="btn-icon btn-delete" onclick="App.deleteReminder('${rem.id}')" title="Удалить">
              🗑
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  toggleReminderStatus(reminderId) {
    const rem = (this.data.reminders || []).find(r => r.id === reminderId);
    if (!rem) return;

    if (!rem.completed && rem.repeat && rem.repeat !== 'none') {
      // Для повторяющихся напоминаний: вычисляем следующую дату
      const curDate = this.parseLocalDate(rem.dueDate || this.getLocalDateStr());
      let nextDate = new Date(curDate.getTime());

      if (rem.repeat === 'daily') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (rem.repeat === 'weekdays') {
        const dayOfWeek = nextDate.getDay(); // 0 вс, 5 пт, 6 сб
        if (dayOfWeek === 5) nextDate.setDate(nextDate.getDate() + 3);
        else if (dayOfWeek === 6) nextDate.setDate(nextDate.getDate() + 2);
        else nextDate.setDate(nextDate.getDate() + 1);
      } else if (rem.repeat === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rem.repeat === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      rem.dueDate = this.getLocalDateStr(nextDate);
      rem.dateTime = rem.hasTime && rem.time ? `${rem.dueDate}T${rem.time}:00` : null;
      rem.notified = false;
      rem.advanceNotified = false;
      rem.updatedAt = new Date().toISOString();

      if (this.data.settings?.soundEnabled) {
        this.playChimeSound();
      }
    } else {
      rem.completed = !rem.completed;
      rem.completedAt = rem.completed ? new Date().toISOString() : null;
      rem.updatedAt = new Date().toISOString();

      if (rem.completed && this.data.settings?.soundEnabled) {
        this.playChimeSound();
      }
    }

    this.saveData();
    this.renderRemindersView();
    this.updateBadges();

    if (this.currentView === 'archive') {
      this.renderArchive();
    }
  },

  snoozeReminderQuick(reminderId, minutes = 15) {
    const rem = (this.data.reminders || []).find(r => r.id === reminderId);
    if (!rem) return;

    const newTime = new Date(Date.now() + minutes * 60 * 1000);
    rem.dueDate = this.getLocalDateStr(newTime);
    rem.hasTime = true;
    rem.time = newTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    rem.dateTime = `${rem.dueDate}T${rem.time}:00`;
    rem.notified = false;
    rem.advanceNotified = true;
    rem.updatedAt = new Date().toISOString();

    this.saveData();
    this.renderRemindersView();
    this.updateBadges();
  },

  deleteReminder(reminderId) {
    if (confirm('Удалить это напоминание?')) {
      if (window.SyncEngine) {
        SyncEngine.recordTombstone(reminderId, 'reminder');
      }
      this.data.reminders = (this.data.reminders || []).filter(r => r.id !== reminderId);
      this.saveData();
      this.renderRemindersView();
      this.renderCurrentView();
      this.updateBadges();
    }
  },

  getDefaultFutureTimeStr() {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },

  openEditReminderModal(reminderId) {
    const rem = (this.data.reminders || []).find(r => r.id === reminderId);
    if (!rem) return;

    const hasTime = !!rem.hasTime;

    document.getElementById('modal-reminder-id').value = rem.id;
    document.getElementById('modal-reminder-text').value = rem.text || '';
    document.getElementById('modal-reminder-date').value = rem.dueDate || this.getLocalDateStr();
    
    const timeCheck = document.getElementById('modal-reminder-has-time');
    const timeWrap = document.getElementById('modal-reminder-time-wrap');
    const timeInput = document.getElementById('modal-reminder-time');
    const advWrap = document.getElementById('modal-reminder-advance-wrap');
    const advSelect = document.getElementById('modal-reminder-advance');
    const advAlsoExactCheck = document.getElementById('modal-reminder-advance-also-exact');

    if (timeCheck) timeCheck.checked = hasTime;
    if (timeWrap) timeWrap.style.display = hasTime ? 'flex' : 'none';
    if (timeInput) timeInput.value = rem.time || this.getDefaultFutureTimeStr();

    if (advWrap) advWrap.style.display = hasTime ? 'flex' : 'none';
    if (advSelect) advSelect.value = String(rem.advanceMinutes || 0);
    if (advAlsoExactCheck) advAlsoExactCheck.checked = rem.advanceAlsoExact !== false;

    document.getElementById('modal-reminder-repeat').value = rem.repeat || 'none';
    this.selectReminderModalColor(rem.color || '');

    this.openModal('modal-reminder');
  },

  saveReminderModal() {
    const id = document.getElementById('modal-reminder-id')?.value;
    const text = document.getElementById('modal-reminder-text')?.value.trim();
    if (!text) {
      alert('Пожалуйста, введите текст напоминания');
      return;
    }

    const dueDate = document.getElementById('modal-reminder-date')?.value || this.getLocalDateStr();
    const hasTime = !!document.getElementById('modal-reminder-has-time')?.checked;
    const time = hasTime ? (document.getElementById('modal-reminder-time')?.value || this.getDefaultFutureTimeStr()) : null;
    const advanceMinutes = hasTime ? (parseInt(document.getElementById('modal-reminder-advance')?.value, 10) || 0) : 0;
    const advanceAlsoExact = hasTime ? (document.getElementById('modal-reminder-advance-also-exact')?.checked !== false) : true;
    const repeat = document.getElementById('modal-reminder-repeat')?.value || 'none';
    const color = document.getElementById('modal-reminder-color')?.value || '';

    const rem = (this.data.reminders || []).find(r => r.id === id);
    if (rem) {
      rem.text = text;
      rem.dueDate = dueDate;
      rem.hasTime = hasTime;
      rem.time = hasTime ? time : null;
      rem.dateTime = hasTime ? `${dueDate}T${time}:00` : null;
      rem.advanceMinutes = advanceMinutes;
      rem.advanceAlsoExact = advanceAlsoExact;
      rem.repeat = repeat;
      rem.color = color;
      rem.notified = false;
      rem.advanceNotified = false;
      rem.updatedAt = new Date().toISOString();
      this.saveData();
    }

    this.closeModal('modal-reminder');
    this.renderRemindersView();
    this.updateBadges();
  },

  deleteReminderFromModal() {
    const id = document.getElementById('modal-reminder-id')?.value;
    if (id && confirm('Удалить это напоминание?')) {
      this.deleteReminder(id);
      this.closeModal('modal-reminder');
    }
  },

  selectReminderModalColor(color) {
    const hiddenInput = document.getElementById('modal-reminder-color');
    if (hiddenInput) hiddenInput.value = color;

    document.querySelectorAll('#modal-reminder-color-palette .color-chip').forEach(btn => {
      if (btn.getAttribute('data-color') === color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  toggleRemindersInArchive(checked) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.remindersInArchive = checked;
    this.saveData();
    if (this.currentView === 'archive') {
      this.renderArchive();
    }
  },

  // =========================================================================
  // Раздел Справки (Help View Methods)
  // =========================================================================
  toggleHelpCard(headerEl) {
    const card = headerEl.closest('.help-card');
    if (card) {
      card.classList.toggle('is-collapsed');
    }
  },

  scrollToHelpTopic(topicId) {
    const el = document.getElementById(topicId);
    if (el) {
      el.classList.remove('is-collapsed');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  onSearchHelp(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('.help-card').forEach(card => {
      if (!q) {
        card.style.display = 'block';
        return;
      }
      const text = card.textContent.toLowerCase();
      if (text.includes(q)) {
        card.style.display = 'block';
        card.classList.remove('is-collapsed');
      } else {
        card.style.display = 'none';
      }
    });
  },

  // =========================================================================
  // Быстрый ввод задачи (Quick Capture)
  // =========================================================================
  quickCaptureSelectedDate: 'today',
  quickCaptureWasMinimized: false,
  quickCaptureTimeBlock: null,

  openQuickCaptureModal(options = {}) {
    this.quickCaptureWasMinimized = !!options.wasMinimized;
    this.quickCaptureTimeBlock = options.timeBlock || null;
    this.populateProjectSelects();

    const titleInput = document.getElementById('quick-task-title');
    if (titleInput) titleInput.value = '';

    const projSelect = document.getElementById('quick-task-project-select');
    if (projSelect) {
      const mainSelect = document.getElementById('new-task-project-select');
      if (options.projectId) {
        const fInfo = this.findFolderInfo(options.projectId);
        if (fInfo) {
          projSelect.value = `${fInfo.section.id}:::${fInfo.folder.id}`;
        } else {
          projSelect.value = options.projectId;
        }
      } else if (mainSelect && mainSelect.value && mainSelect.value.includes(':::')) {
        projSelect.value = mainSelect.value;
      } else if (typeof this.currentView === 'object' && this.currentView.sectionId && this.currentView.projectId) {
        projSelect.value = `${this.currentView.sectionId}:::${this.currentView.projectId}`;
      } else {
        const firstOpt = projSelect.querySelector('option');
        if (firstOpt) projSelect.value = firstOpt.value;
      }
    }

    if (options.dueDate) {
      const todayStr = this.getLocalDateStr();
      const tomorrowStr = this.getLocalDatePlusDays(1);
      if (options.dueDate === todayStr) {
        this.setQuickCaptureDate('today');
      } else if (options.dueDate === tomorrowStr) {
        this.setQuickCaptureDate('tomorrow');
      } else {
        this.setQuickCaptureDate('custom', options.dueDate);
      }
    } else {
      this.setQuickCaptureDate('today');
    }

    const reminderCheck = document.getElementById('quick-task-has-reminder');
    const timeBox = document.getElementById('quick-task-time-box');
    const timeInput = document.getElementById('quick-task-time');
    const advSelect = document.getElementById('quick-task-reminder-advance');
    const repeatSelect = document.getElementById('quick-task-repeat');

    const hasReminder = !!options.hasReminder;
    if (reminderCheck) reminderCheck.checked = hasReminder;
    if (timeBox) timeBox.style.display = hasReminder ? 'flex' : 'none';
    if (timeInput) timeInput.value = options.time || '12:00';
    if (advSelect) advSelect.value = options.reminderAdvance ? String(options.reminderAdvance) : '0';
    if (repeatSelect) repeatSelect.value = 'none';

    this.selectQuickTaskColor('');

    const autoMinCheck = document.getElementById('quick-task-auto-minimize');
    if (autoMinCheck) {
      autoMinCheck.checked = options.wasMinimized ? (this.data.settings?.hotkeys?.autoMinimize !== false) : false;
    }

    const modalTitle = document.querySelector('#modal-quick-capture .modal-title');
    if (modalTitle) {
      if (options.dueDate) {
        const d = this.parseLocalDate(options.dueDate);
        const dayFormatted = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
        const timePart = options.time ? ` в ${options.time}` : '';
        modalTitle.textContent = `Добавить задачу на ${dayFormatted}${timePart}`;
      } else {
        modalTitle.textContent = 'Быстрое добавление задачи';
      }
    }

    this.openModal('modal-quick-capture');

    setTimeout(() => {
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 50);
  },

  closeQuickCaptureModal() {
    this.quickCaptureTimeBlock = null;
    this.closeModal('modal-quick-capture');
  },

  setQuickCaptureDate(type, customVal = null) {
    this.quickCaptureSelectedDate = type;
    document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('active'));

    const customInput = document.getElementById('quick-task-custom-date');

    if (type === 'today') {
      document.getElementById('quick-date-today')?.classList.add('active');
      if (customInput) customInput.value = this.getLocalDateStr();
    } else if (type === 'tomorrow') {
      document.getElementById('quick-date-tomorrow')?.classList.add('active');
      if (customInput) customInput.value = this.getLocalDatePlusDays(1);
    } else if (type === 'none') {
      document.getElementById('quick-date-none')?.classList.add('active');
      if (customInput) customInput.value = '';
    } else if (type === 'custom') {
      if (customInput && customVal) {
        customInput.value = customVal;
      }
    }
  },

  onQuickCaptureCustomDateChange(val) {
    document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('active'));
    this.quickCaptureSelectedDate = val ? 'custom' : 'none';
    if (!val) {
      document.getElementById('quick-date-none')?.classList.add('active');
    }
  },

  selectQuickTaskColor(color) {
    const hiddenInput = document.getElementById('quick-task-color');
    if (hiddenInput) hiddenInput.value = color;

    document.querySelectorAll('#quick-task-color-palette .color-chip').forEach(btn => {
      if (btn.getAttribute('data-color') === color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  async saveQuickCaptureTask() {
    const titleInput = document.getElementById('quick-task-title');
    const title = titleInput?.value.trim();
    if (!title) {
      if (titleInput) titleInput.focus();
      return;
    }

    const projSelect = document.getElementById('quick-task-project-select');
    let sectionId = 'work';
    let projectId = 'proj-work-general';

    if (projSelect && projSelect.value) {
      const parts = projSelect.value.split(':::');
      if (parts.length === 2) {
        sectionId = parts[0];
        projectId = parts[1];
      }
    }

    const folderInfo = this.findFolderInfo(projectId);
    if (folderInfo) {
      sectionId = folderInfo.section.id;
      projectId = folderInfo.folder.id;
    }

    // Определение срока выполнения
    let dueDate = null;
    const customDateVal = document.getElementById('quick-task-custom-date')?.value;
    if (this.quickCaptureSelectedDate === 'today') {
      dueDate = this.getLocalDateStr();
    } else if (this.quickCaptureSelectedDate === 'tomorrow') {
      dueDate = this.getLocalDatePlusDays(1);
    } else if (this.quickCaptureSelectedDate === 'none') {
      dueDate = null;
    } else if (this.quickCaptureSelectedDate === 'custom' && customDateVal) {
      dueDate = customDateVal;
    } else if (customDateVal) {
      dueDate = customDateVal;
    }

    // Напоминание / Будильник
    let reminderTime = null;
    let reminderAdvance = 0;
    const hasReminder = document.getElementById('quick-task-has-reminder')?.checked;
    const timeVal = document.getElementById('quick-task-time')?.value || '12:00';
    const advanceVal = hasReminder ? (parseInt(document.getElementById('quick-task-reminder-advance')?.value, 10) || 0) : 0;
    if (hasReminder && dueDate) {
      reminderTime = `${dueDate}T${timeVal}:00`;
      reminderAdvance = advanceVal;
    } else if (hasReminder && !dueDate) {
      dueDate = this.getLocalDateStr();
      reminderTime = `${dueDate}T${timeVal}:00`;
      reminderAdvance = advanceVal;
    }

    const color = document.getElementById('quick-task-color')?.value || '';
    const repeat = document.getElementById('quick-task-repeat')?.value || 'none';

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title,
      description: '',
      descriptionCollapsed: (this.data.settings?.defaultSubtasksExpanded || 'collapsed') === 'collapsed',
      sectionId: sectionId,
      projectId: projectId,
      color: color,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate,
      reminderTime: reminderTime,
      reminderAdvance: reminderAdvance,
      reminderAdvanceAlsoExact: true,
      reminderNotified: false,
      advanceNotified: false,
      repeat: repeat,
      timeSpentSeconds: 0,
      subtasks: [],
      subtasksCollapsed: (this.data.settings?.defaultSubtasksExpanded || 'collapsed') === 'collapsed',
      timeBlock: this.quickCaptureTimeBlock || null,
      order: this.data.tasks.length + 1
    };

    this.quickCaptureTimeBlock = null;

    this.data.tasks.unshift(newTask);
    this.saveData();

    this.renderCurrentView();
    if (this.todayTimelineMode === 'split' && this.currentView === 'today') {
      this.renderTodayTimeline();
    }
    if (this.currentView === 'timeline') {
      this.renderTimelineView();
    }
    this.renderSidebar();
    this.updateBadges();

    if (this.data.settings?.soundEnabled) {
      this.playTone('digital');
    }

    const shouldMinimize = document.getElementById('quick-task-auto-minimize')?.checked;
    if (this.data.settings?.hotkeys) {
      this.data.settings.hotkeys.autoMinimize = shouldMinimize;
    }

    this.closeQuickCaptureModal();

    if (shouldMinimize && window.electronAPI?.minimizeWindow && this.quickCaptureWasMinimized) {
      window.electronAPI.minimizeWindow();
    }
  },

  onMinimizeToTrayToggle(checked) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.minimizeToTray = checked;
    this.saveData();
    if (window.electronAPI?.setMinimizeToTray) {
      window.electronAPI.setMinimizeToTray(checked);
    }
  },

  async onAutostartWindowsToggle(checked) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.autostartWindows = checked;
    this.saveData();
    if (window.electronAPI?.setAutostartWindows) {
      await window.electronAPI.setAutostartWindows(checked);
    }
  },

  onGlobalShortcutTriggered(data) {
    this.openQuickCaptureModal({
      fromGlobal: true,
      wasMinimized: data?.wasMinimized
    });
  },

  // =========================================================================
  // Управление вкладками настроек и горячими клавишами
  // =========================================================================
  isRecordingHotkey: false,
  tempRecordedCombo: '',
  keyRecordHandler: null,

  switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-tab-panel').forEach(panel => panel.classList.remove('active'));

    const btn = document.getElementById(`tab-btn-${tabId}`);
    const panel = document.getElementById(`settings-panel-${tabId}`);

    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');

    this.refreshSettingsUI();
  },

  renderHotkeySettings() {
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) {
      this.data.settings.hotkeys = {
        globalQuickCapture: 'Alt+Space',
        enabled: true,
        autoMinimize: true
      };
    }

    const currentKey = this.data.settings.hotkeys.globalQuickCapture || 'Alt+Space';
    const isEnabled = this.data.settings.hotkeys.enabled !== false;

    const enabledCheck = document.getElementById('setting-hotkey-enabled');
    if (enabledCheck) enabledCheck.checked = isEnabled;

    const displayEl = document.getElementById('hotkey-display-keys');
    if (displayEl) {
      const parts = currentKey.split('+');
      displayEl.innerHTML = parts.map(p => `<kbd>${this.escapeHtml(p.trim())}</kbd>`).join(' + ');
    }

    const statusEl = document.getElementById('hotkey-status-message');
    if (statusEl) {
      if (isEnabled) {
        statusEl.style.display = 'block';
        statusEl.className = 'status-msg-success';
        statusEl.textContent = `✅ Глобальная комбинация ${currentKey} активна во всей системе Windows.`;
      } else {
        statusEl.style.display = 'block';
        statusEl.className = 'status-msg-info';
        statusEl.textContent = 'ℹ️ Глобальное сочетание клавиш отключено.';
      }
    }

    this.renderInternalHotkeysList();
  },

  internalHotkeyDefs: [
    {
      id: 'newTask',
      title: 'Создать новую задачу',
      desc: 'Открывает окно быстрого добавления задачи (по умолчанию Ctrl+N)',
      default: 'Ctrl+N'
    },
    {
      id: 'searchTasks',
      title: 'Поиск по задачам',
      desc: 'Устанавливает фокус в строку поиска текущего экрана (по умолчанию Ctrl+F)',
      default: 'Ctrl+F'
    },
    {
      id: 'toggleBreak',
      title: 'Начать / Стоп перерыв ☕',
      desc: 'Включает или останавливает таймер отдыха (по умолчанию Ctrl+B)',
      default: 'Ctrl+B'
    },
    {
      id: 'openNote',
      title: 'Заметка к задаче 📖',
      desc: 'Открывает полноэкранный редактор заметок активной задачи (по умолчанию Ctrl+M)',
      default: 'Ctrl+M'
    },
    {
      id: 'toggleExpandAll',
      title: 'Свернуть / Развернуть все 📁',
      desc: 'Переключает раскрытие всех подпунктов и папок (по умолчанию Ctrl+E)',
      default: 'Ctrl+E'
    }
  ],

  renderInternalHotkeysList() {
    const listEl = document.getElementById('internal-hotkeys-list');
    if (!listEl) return;

    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) this.data.settings.hotkeys = {};

    let html = '';
    this.internalHotkeyDefs.forEach(def => {
      const currentCombo = this.data.settings.hotkeys[def.id] || def.default;
      const parts = currentCombo.split('+');
      const kbdHtml = parts.map(p => `<kbd>${this.escapeHtml(p.trim())}</kbd>`).join(' + ');

      html += `
        <div class="shortcut-setting-row" id="shortcut-row-${def.id}">
          <div class="shortcut-setting-label">
            <span class="shortcut-setting-title">${def.title}</span>
            <span class="shortcut-setting-desc">${def.desc}</span>
          </div>
          <div class="shortcut-setting-actions">
            <span id="hotkey-display-${def.id}">${kbdHtml}</span>
            <button type="button" class="btn-xs btn-primary" onclick="App.startHotkeyRecording('${def.id}')" title="Назначить свое сочетание">✏️ Изменить</button>
            <button type="button" class="btn-xs btn-subtle" onclick="App.resetHotkeyToAction('${def.id}')" title="Вернуть по умолчанию (${def.default})">↺</button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  resetHotkeyToAction(actionId) {
    const def = this.internalHotkeyDefs.find(d => d.id === actionId);
    if (!def) return;
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) this.data.settings.hotkeys = {};
    this.data.settings.hotkeys[actionId] = def.default;
    this.saveData();
    this.renderInternalHotkeysList();
  },

  resetAllInternalHotkeys() {
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) this.data.settings.hotkeys = {};
    this.internalHotkeyDefs.forEach(def => {
      this.data.settings.hotkeys[def.id] = def.default;
    });
    this.saveData();
    this.renderInternalHotkeysList();
    alert('Все внутренние горячие клавиши программы сброшены на стандартные.');
  },

  matchesHotkey(e, comboStr) {
    if (!comboStr || typeof comboStr !== 'string') return false;
    const parts = comboStr.toLowerCase().split('+').map(s => s.trim());
    const hasCtrl = parts.includes('ctrl') || parts.includes('control') || parts.includes('commandorcontrol');
    const hasAlt = parts.includes('alt');
    const hasShift = parts.includes('shift');
    const hasMeta = parts.includes('win') || parts.includes('cmd') || parts.includes('meta');

    if (hasCtrl !== (e.ctrlKey || e.metaKey)) return false;
    if (hasAlt !== e.altKey) return false;
    if (hasShift !== e.shiftKey) return false;

    const keyPart = parts.filter(p => !['ctrl', 'control', 'commandorcontrol', 'alt', 'shift', 'win', 'cmd', 'meta'].includes(p))[0];
    if (!keyPart) return false;

    const pressedKey = e.key.toLowerCase();
    if (keyPart === 'space' && (e.code === 'Space' || pressedKey === ' ')) return true;
    if (keyPart === pressedKey) return true;

    // Русская раскладка клавиатуры
    const ruEnMap = {
      'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з',
      'a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л','l':'д',
      'z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь'
    };
    if (ruEnMap[keyPart] && ruEnMap[keyPart] === pressedKey) return true;
    for (const [en, ru] of Object.entries(ruEnMap)) {
      if (ru === keyPart && en === pressedKey) return true;
    }

    if (e.code && e.code.startsWith('Key')) {
      const codeKey = e.code.slice(3).toLowerCase();
      if (codeKey === keyPart) return true;
    }

    return false;
  },

  recordingTargetAction: 'globalQuickCapture',

  async onHotkeyEnabledToggle(enabled) {
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) {
      this.data.settings.hotkeys = {
        globalQuickCapture: 'Alt+Space',
        enabled: true,
        autoMinimize: true
      };
    }

    this.data.settings.hotkeys.enabled = enabled;
    this.saveData();

    if (window.electronAPI?.registerGlobalShortcut) {
      await window.electronAPI.registerGlobalShortcut({
        shortcut: this.data.settings.hotkeys.globalQuickCapture,
        enabled: enabled
      });
      this.renderHotkeySettings();
    }
  },

  startHotkeyRecording(targetAction = 'globalQuickCapture') {
    this.isRecordingHotkey = true;
    this.recordingTargetAction = targetAction;
    this.tempRecordedCombo = '';

    const box = document.getElementById('hotkey-recorder-box');
    const title = document.getElementById('hotkey-recorder-title');
    const preview = document.getElementById('hotkey-live-preview');
    const saveBtn = document.getElementById('btn-save-recorded-hotkey');

    let actionName = 'быстрого глобального ввода задачи';
    if (targetAction !== 'globalQuickCapture') {
      const def = this.internalHotkeyDefs.find(d => d.id === targetAction);
      if (def) actionName = `«${def.title}»`;
    }

    if (box) {
      box.style.display = 'block';
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (title) title.textContent = `🔴 Нажмите клавиши на клавиатуре для: ${actionName}`;
    if (preview) preview.textContent = 'Ожидание нажатия...';
    if (saveBtn) saveBtn.disabled = true;

    if (this.keyRecordHandler) {
      window.removeEventListener('keydown', this.keyRecordHandler, true);
    }

    this.keyRecordHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        this.cancelHotkeyRecording();
        return;
      }

      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Win');

      let key = e.key;
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        if (preview) preview.textContent = modifiers.join(' + ') + ' + ...';
        return;
      }

      if (key === ' ') key = 'Space';
      else if (key.length === 1) key = key.toUpperCase();

      if (modifiers.length > 0 || key.startsWith('F')) {
        const combo = modifiers.length > 0 ? (modifiers.join('+') + '+' + key) : key;
        this.tempRecordedCombo = combo;
        if (preview) preview.textContent = combo.replace(/\+/g, ' + ');
        if (saveBtn) saveBtn.disabled = false;
      } else {
        if (preview) preview.textContent = '⚠️ Добавьте модификатор (например, Ctrl+' + key + ' или Alt+' + key + ')';
        if (saveBtn) saveBtn.disabled = true;
      }
    };

    window.addEventListener('keydown', this.keyRecordHandler, true);
  },

  cancelHotkeyRecording() {
    this.isRecordingHotkey = false;
    this.recordingTargetAction = 'globalQuickCapture';
    this.tempRecordedCombo = '';

    if (this.keyRecordHandler) {
      window.removeEventListener('keydown', this.keyRecordHandler, true);
      this.keyRecordHandler = null;
    }

    const box = document.getElementById('hotkey-recorder-box');
    if (box) box.style.display = 'none';
  },

  async applyRecordedHotkey() {
    if (!this.tempRecordedCombo) return;
    const combo = this.tempRecordedCombo;
    const targetAction = this.recordingTargetAction || 'globalQuickCapture';
    this.cancelHotkeyRecording();

    if (targetAction === 'globalQuickCapture') {
      await this.setHotkeyPreset(combo);
    } else {
      if (!this.data.settings) this.data.settings = {};
      if (!this.data.settings.hotkeys) this.data.settings.hotkeys = {};
      this.data.settings.hotkeys[targetAction] = combo;
      this.saveData();
      this.renderInternalHotkeysList();

      const statusEl = document.getElementById('hotkey-status-message');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'status-msg-success';
        statusEl.textContent = `✅ Горячая клавиша успешно сохранена: ${combo}`;
      }
    }
  },

  async setHotkeyPreset(comboStr) {
    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.hotkeys) this.data.settings.hotkeys = {};

    this.data.settings.hotkeys.globalQuickCapture = comboStr;
    this.data.settings.hotkeys.enabled = true;
    this.saveData();

    const statusEl = document.getElementById('hotkey-status-message');

    if (window.electronAPI?.registerGlobalShortcut) {
      const res = await window.electronAPI.registerGlobalShortcut({
        shortcut: comboStr,
        enabled: true
      });

      if (res && res.success) {
        this.renderHotkeySettings();
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.className = 'status-msg-success';
          statusEl.textContent = `✅ Горячая клавиша ${comboStr} успешно установлена и работает!`;
        }
      } else {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.className = 'status-msg-error';
          statusEl.textContent = `❌ ${res?.error || 'Не удалось зарегистрировать комбинацию'}`;
        }
      }
    } else {
      this.renderHotkeySettings();
    }
  },

  sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'contenteditable', 'data-checked', 'data-id', 'style'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      });
    }
    return html;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.App = App;
window.TimerEngine = TimerEngine;
window.Storage = Storage;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
