export type Team = {
  id: number;
  name: string;
  score: number;
  updated_at: string | null;
  game_scores: GameScore[];
};

export type GameScore = { game_id: number; score: number; updated_at: string | null };

export type TeamRoster = {
  id: number;
  name: string;
  members: string[];
};

/** Neo-Tokyo scuderias — ids 1–14 and nicknames preserved. */
export const teamRosters: TeamRoster[] = [
  { id: 1, name: 'Shibuya Apex GP', members: ['Весельчак', 'Хохотушка', 'Штурман', 'Мисс Позитив', 'Апельсинка', 'Агат', 'Звёздочка', 'Пончик', 'Карабин', 'Гроза'] },
  { id: 2, name: 'Akihabara Nitro', members: ['Добряк', 'Коралл', 'Капучино', 'Следопыт', 'Метелица', 'Северное Сияние', 'Топаз', 'Опал', 'Мистер Баллы', 'Альпеншток'] },
  { id: 3, name: 'Roppongi Velocity', members: ['Батарейка', 'Горный Орёл', 'Перевал', 'Циклон', 'Мармеладка', 'Доктор Смех', 'Аметист', 'Ватрушка', 'Комета', 'Дозорный'] },
  { id: 4, name: 'Ginza Circuit', members: ['Малахит', 'Ястреб', 'Морошка', 'Карамелька', 'Искра', 'Росомаха', 'Кнопка', 'Волна', 'Ракета', 'Корица'] },
  { id: 5, name: 'Harajuku Drift', members: ['Латте', 'Вишенка', 'Вершинка', 'Янтарь', 'Лавина', 'Снежинка', 'Альбатрос', 'Затейница', 'Баурсачок', 'Кумыс'] },
  { id: 6, name: 'Shinjuku Overdrive', members: ['Навигатор', 'Бирюза', 'Пеликан', 'Фонарик', 'Кремень', 'Апорт', 'Айсберг', 'Шторм', 'Горец', 'Профессор'] },
  { id: 7, name: 'Odaiba Pulse', members: ['Зефирка', 'Тянь-Шань', 'Умница', 'Брусника', 'Беркут', 'Тулпар', 'Жемчужина', 'Шустрик', 'Дракоша', 'Гранит', 'Эдельвейс'] },
  { id: 8, name: 'Asakusa Vortex', members: ['Прибой', 'Буревестник', 'Сокол', 'Лимончик', 'Моторчик', 'Генератор Идей', 'Лунатик', 'Печенька', 'Черешня', 'Пассат'] },
  { id: 9, name: 'Yokohama Bay GP', members: ['Стриж', 'Скалолаз', 'Ураган', 'Тюльпан', 'Пегас', 'Цунами', 'Метеор', 'Шоколадка', 'Кедр', 'Звездочёт'] },
  { id: 10, name: 'Osaka Neon Motors', members: ['Бриз', 'Мистраль', 'Рысь', 'Малинка', 'Чайка', 'Феникс', 'Белка', 'Боцман', 'Пружинка', 'Компас'] },
  { id: 11, name: 'Nagoya Turbo Line', members: ['Пилигрим', 'Мятка', 'Обсидиан', 'Кварц', 'Рубин', 'Рюкзачок', 'Колибри', 'Ледник', 'Облачко', 'Торнадо'] },
  { id: 12, name: 'Fuji Speedworks', members: ['Муссон', 'Серпантин', 'Вулкан', 'Яшма', 'Полярная Звезда', 'Саксаул', 'Солнышко', 'Гроссмейстер', 'Флагман', 'Турбо'] },
  { id: 13, name: 'Hakone Slipstream', members: ['Лайка', 'Ириска', 'Гейзер', 'Маяк', 'Пантера', 'Облепиха', 'Сапфир', 'Ежевика', 'Ледоруб', 'Конфетка'] },
  { id: 14, name: 'Kyoto Ronin Motorsport', members: ['Зарница', 'Самум', 'Шерпа', 'Туманность', 'Снежный Барс', 'Единорог', 'Мечтательница', 'Самса', 'Непоседа', 'Фламинго'] },
];

export const initialTeams: Team[] = teamRosters.map((team) => ({
  id: team.id,
  name: team.name,
  score: 0,
  updated_at: null,
  game_scores: [],
}));

export const participants = teamRosters.flatMap((team) =>
  team.members.map((name) => ({ name, teamId: team.id, teamName: team.name })),
);
