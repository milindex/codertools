'use client';

import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

type EmojiCategory =
  | 'smileys'
  | 'people'
  | 'nature'
  | 'animals'
  | 'food'
  | 'travel'
  | 'objects'
  | 'symbols';

type EmojiEntry = {
  char: string;
  name: string;
  keywords: string[];
  category: EmojiCategory;
};

const CATEGORIES: Array<{ id: EmojiCategory; label: string }> = [
  { id: 'smileys', label: 'Smileys & emotion' },
  { id: 'people', label: 'People & hands' },
  { id: 'nature', label: 'Nature & weather' },
  { id: 'animals', label: 'Animals' },
  { id: 'food', label: 'Food & drink' },
  { id: 'travel', label: 'Travel & places' },
  { id: 'objects', label: 'Objects' },
  { id: 'symbols', label: 'Symbols' },
];

const e = (
  char: string,
  name: string,
  category: EmojiCategory,
  keywords: string[] = []
): EmojiEntry => ({ char, name, category, keywords });

const EMOJIS: EmojiEntry[] = [
  e('😀', 'grinning face', 'smileys', ['happy', 'smile']),
  e('😃', 'grinning face with big eyes', 'smileys', ['happy', 'smile']),
  e('😄', 'grinning face with smiling eyes', 'smileys', ['happy']),
  e('😁', 'beaming face', 'smileys', ['grin']),
  e('😆', 'grinning squinting face', 'smileys', ['laugh']),
  e('😅', 'grinning face with sweat', 'smileys', ['relief']),
  e('😂', 'face with tears of joy', 'smileys', ['laugh', 'cry']),
  e('🤣', 'rolling on the floor laughing', 'smileys', ['lol']),
  e('😊', 'smiling face with smiling eyes', 'smileys', ['blush']),
  e('😇', 'smiling face with halo', 'smileys', ['angel']),
  e('🙂', 'slightly smiling face', 'smileys', ['smile']),
  e('😉', 'winking face', 'smileys', ['wink']),
  e('😍', 'smiling face with heart-eyes', 'smileys', ['love']),
  e('🥰', 'smiling face with hearts', 'smileys', ['love']),
  e('😘', 'face blowing a kiss', 'smileys', ['kiss']),
  e('😋', 'face savoring food', 'smileys', ['yum']),
  e('😛', 'face with tongue', 'smileys', ['tongue']),
  e('😜', 'winking face with tongue', 'smileys', ['silly']),
  e('🤪', 'zany face', 'smileys', ['crazy']),
  e('🤨', 'face with raised eyebrow', 'smileys', ['skeptical']),
  e('🧐', 'face with monocle', 'smileys', ['inspect']),
  e('🤓', 'nerd face', 'smileys', ['geek']),
  e('😎', 'smiling face with sunglasses', 'smileys', ['cool']),
  e('🥳', 'partying face', 'smileys', ['celebrate']),
  e('😏', 'smirking face', 'smileys', ['smug']),
  e('😒', 'unamused face', 'smileys', ['meh']),
  e('😞', 'disappointed face', 'smileys', ['sad']),
  e('😔', 'pensive face', 'smileys', ['sad']),
  e('😟', 'worried face', 'smileys', ['concern']),
  e('😕', 'confused face', 'smileys', ['unsure']),
  e('😣', 'persevering face', 'smileys', ['struggle']),
  e('😖', 'confounded face', 'smileys', ['frustrated']),
  e('😫', 'tired face', 'smileys', ['exhausted']),
  e('😩', 'weary face', 'smileys', ['tired']),
  e('🥺', 'pleading face', 'smileys', ['puppy eyes']),
  e('😢', 'crying face', 'smileys', ['sad', 'tear']),
  e('😭', 'loudly crying face', 'smileys', ['sob']),
  e('😤', 'face with steam from nose', 'smileys', ['angry']),
  e('😠', 'angry face', 'smileys', ['mad']),
  e('😡', 'pouting face', 'smileys', ['rage']),
  e('🤬', 'face with symbols on mouth', 'smileys', ['swearing']),
  e('🤯', 'exploding head', 'smileys', ['mind blown']),
  e('😳', 'flushed face', 'smileys', ['embarrassed']),
  e('🥵', 'hot face', 'smileys', ['heat']),
  e('🥶', 'cold face', 'smileys', ['freezing']),
  e('😱', 'face screaming in fear', 'smileys', ['shock']),
  e('😨', 'fearful face', 'smileys', ['scared']),
  e('😰', 'anxious face with sweat', 'smileys', ['nervous']),
  e('😥', 'sad but relieved face', 'smileys', ['relief']),
  e('😓', 'downcast face with sweat', 'smileys', ['stress']),
  e('🤗', 'hugging face', 'smileys', ['hug']),
  e('🤔', 'thinking face', 'smileys', ['hmm']),
  e('🤭', 'face with hand over mouth', 'smileys', ['oops']),
  e('🤫', 'shushing face', 'smileys', ['quiet']),
  e('😶', 'face without mouth', 'smileys', ['silent']),
  e('😐', 'neutral face', 'smileys', ['blank']),
  e('😑', 'expressionless face', 'smileys', ['flat']),
  e('😬', 'grimacing face', 'smileys', ['awkward']),
  e('🙄', 'face with rolling eyes', 'smileys', ['annoyed']),
  e('😯', 'hushed face', 'smileys', ['surprised']),
  e('😲', 'astonished face', 'smileys', ['amazed']),
  e('🥱', 'yawning face', 'smileys', ['bored']),
  e('😴', 'sleeping face', 'smileys', ['sleep']),
  e('🤤', 'drooling face', 'smileys', ['drool']),
  e('😪', 'sleepy face', 'smileys', ['tired']),
  e('😵', 'dizzy face', 'smileys', ['dead']),
  e('🤐', 'zipper-mouth face', 'smileys', ['secret']),
  e('🥴', 'woozy face', 'smileys', ['drunk']),
  e('🤢', 'nauseated face', 'smileys', ['sick']),
  e('🤮', 'vomiting face', 'smileys', ['sick']),
  e('🤧', 'sneezing face', 'smileys', ['sick']),
  e('😷', 'face with medical mask', 'smileys', ['mask']),
  e('🤒', 'face with thermometer', 'smileys', ['sick']),
  e('🤕', 'face with head-bandage', 'smileys', ['hurt']),
  e('🤑', 'money-mouth face', 'smileys', ['money']),
  e('🤠', 'cowboy hat face', 'smileys', ['yeehaw']),
  e('😈', 'smiling face with horns', 'smileys', ['devil']),
  e('👿', 'angry face with horns', 'smileys', ['devil']),
  e('👻', 'ghost', 'smileys', ['halloween', 'boo']),
  e('💀', 'skull', 'smileys', ['dead']),
  e('🤖', 'robot', 'smileys', ['bot', 'ai']),
  e('👋', 'waving hand', 'people', ['hello', 'bye']),
  e('🤚', 'raised back of hand', 'people', ['stop']),
  e('✋', 'raised hand', 'people', ['stop', 'high five']),
  e('🖖', 'vulcan salute', 'people', ['spock']),
  e('👌', 'OK hand', 'people', ['okay']),
  e('🤌', 'pinched fingers', 'people', ['italian']),
  e('✌️', 'victory hand', 'people', ['peace']),
  e('🤞', 'crossed fingers', 'people', ['luck']),
  e('🤟', 'love-you gesture', 'people', ['love']),
  e('🤘', 'sign of the horns', 'people', ['rock']),
  e('🤙', 'call me hand', 'people', ['shaka']),
  e('👈', 'backhand index pointing left', 'people', ['point']),
  e('👉', 'backhand index pointing right', 'people', ['point']),
  e('👆', 'backhand index pointing up', 'people', ['point']),
  e('👇', 'backhand index pointing down', 'people', ['point']),
  e('☝️', 'index pointing up', 'people', ['point']),
  e('👍', 'thumbs up', 'people', ['like', 'approve']),
  e('👎', 'thumbs down', 'people', ['dislike']),
  e('✊', 'raised fist', 'people', ['power']),
  e('👊', 'oncoming fist', 'people', ['punch']),
  e('🤛', 'left-facing fist', 'people', ['fist bump']),
  e('🤜', 'right-facing fist', 'people', ['fist bump']),
  e('👏', 'clapping hands', 'people', ['applause']),
  e('🙌', 'raising hands', 'people', ['celebrate']),
  e('👐', 'open hands', 'people', ['hug']),
  e('🤲', 'palms up together', 'people', ['pray']),
  e('🤝', 'handshake', 'people', ['deal', 'agree']),
  e('🙏', 'folded hands', 'people', ['please', 'thanks']),
  e('💪', 'flexed biceps', 'people', ['strong']),
  e('🧠', 'brain', 'people', ['smart']),
  e('👀', 'eyes', 'people', ['look', 'watch']),
  e('👁️', 'eye', 'people', ['see']),
  e('👄', 'mouth', 'people', ['lips']),
  e('👂', 'ear', 'people', ['hear']),
  e('👃', 'nose', 'people', ['smell']),
  e('👣', 'footprints', 'people', ['steps']),
  e('🙋', 'person raising hand', 'people', ['question']),
  e('🤦', 'person facepalming', 'people', ['oops']),
  e('🤷', 'person shrugging', 'people', ['idk']),
  e('💃', 'woman dancing', 'people', ['dance']),
  e('🕺', 'man dancing', 'people', ['dance']),
  e('🧘', 'person in lotus position', 'people', ['meditate']),
  e('🌟', 'glowing star', 'nature', ['star']),
  e('⭐', 'star', 'nature', ['favorite']),
  e('🌠', 'shooting star', 'nature', ['wish']),
  e('🌌', 'milky way', 'nature', ['galaxy', 'space']),
  e('🌈', 'rainbow', 'nature', ['pride']),
  e('🌊', 'water wave', 'nature', ['ocean']),
  e('🌪️', 'tornado', 'nature', ['wind']),
  e('🌫️', 'fog', 'nature', ['mist']),
  e('🍂', 'fallen leaf', 'nature', ['autumn']),
  e('🍁', 'maple leaf', 'nature', ['autumn', 'canada']),
  e('🍃', 'leaf fluttering in wind', 'nature', ['leaf']),
  e('🌿', 'herb', 'nature', ['plant']),
  e('☘️', 'shamrock', 'nature', ['lucky']),
  e('🍀', 'four leaf clover', 'nature', ['luck']),
  e('🌱', 'seedling', 'nature', ['grow']),
  e('🌲', 'evergreen tree', 'nature', ['tree']),
  e('🌳', 'deciduous tree', 'nature', ['tree']),
  e('🌴', 'palm tree', 'nature', ['tropical']),
  e('🌵', 'cactus', 'nature', ['desert']),
  e('🌾', 'sheaf of rice', 'nature', ['grain']),
  e('🌷', 'tulip', 'nature', ['flower']),
  e('🌹', 'rose', 'nature', ['flower', 'love']),
  e('🥀', 'wilted flower', 'nature', ['flower']),
  e('🌺', 'hibiscus', 'nature', ['flower']),
  e('🌸', 'cherry blossom', 'nature', ['flower', 'sakura']),
  e('🌼', 'blossom', 'nature', ['flower']),
  e('🌻', 'sunflower', 'nature', ['flower']),
  e('🌞', 'sun with face', 'nature', ['sunny']),
  e('🌝', 'full moon face', 'nature', ['moon']),
  e('🌚', 'new moon face', 'nature', ['moon']),
  e('🌙', 'crescent moon', 'nature', ['night']),
  e('🌍', 'globe showing Europe and Africa', 'nature', ['earth', 'world']),
  e('🌎', 'globe showing Americas', 'nature', ['earth', 'world']),
  e('🌏', 'globe showing Asia and Australia', 'nature', ['earth', 'world']),
  e('🪐', 'ringed planet', 'nature', ['saturn', 'space']),
  e('💫', 'dizzy', 'nature', ['star']),
  e('☄️', 'comet', 'nature', ['space']),
  e('⚡', 'high voltage', 'nature', ['lightning', 'zap']),
  e('🔥', 'fire', 'nature', ['hot', 'lit']),
  e('❄️', 'snowflake', 'nature', ['snow', 'cold']),
  e('⛄', 'snowman without snow', 'nature', ['winter']),
  e('🌡️', 'thermometer', 'nature', ['temperature']),
  e('💧', 'droplet', 'nature', ['water']),
  e('🐶', 'dog face', 'animals', ['puppy']),
  e('🐱', 'cat face', 'animals', ['kitten']),
  e('🐭', 'mouse face', 'animals', ['mouse']),
  e('🐹', 'hamster', 'animals', ['pet']),
  e('🐰', 'rabbit face', 'animals', ['bunny']),
  e('🦊', 'fox', 'animals', ['clever']),
  e('🐻', 'bear', 'animals', ['bear']),
  e('🐼', 'panda', 'animals', ['bear']),
  e('🐨', 'koala', 'animals', ['australia']),
  e('🐯', 'tiger face', 'animals', ['cat']),
  e('🦁', 'lion', 'animals', ['king']),
  e('🐮', 'cow face', 'animals', ['moo']),
  e('🐷', 'pig face', 'animals', ['oink']),
  e('🐸', 'frog', 'animals', ['toad']),
  e('🐵', 'monkey face', 'animals', ['ape']),
  e('🐔', 'chicken', 'animals', ['hen']),
  e('🐧', 'penguin', 'animals', ['cold']),
  e('🐦', 'bird', 'animals', ['tweet']),
  e('🦆', 'duck', 'animals', ['quack']),
  e('🦅', 'eagle', 'animals', ['bird']),
  e('🦉', 'owl', 'animals', ['wise', 'night']),
  e('🦇', 'bat', 'animals', ['night']),
  e('🐺', 'wolf', 'animals', ['howl']),
  e('🐴', 'horse face', 'animals', ['pony']),
  e('🦄', 'unicorn', 'animals', ['magic']),
  e('🐝', 'honeybee', 'animals', ['bee']),
  e('🐛', 'bug', 'animals', ['insect', 'debug']),
  e('🦋', 'butterfly', 'animals', ['insect']),
  e('🐌', 'snail', 'animals', ['slow']),
  e('🐞', 'lady beetle', 'animals', ['bug']),
  e('🐢', 'turtle', 'animals', ['slow']),
  e('🐍', 'snake', 'animals', ['python']),
  e('🦎', 'lizard', 'animals', ['reptile']),
  e('🐙', 'octopus', 'animals', ['sea']),
  e('🦑', 'squid', 'animals', ['sea']),
  e('🦀', 'crab', 'animals', ['sea']),
  e('🐠', 'tropical fish', 'animals', ['fish']),
  e('🐟', 'fish', 'animals', ['sea']),
  e('🐬', 'dolphin', 'animals', ['sea']),
  e('🐳', 'spouting whale', 'animals', ['sea']),
  e('🦈', 'shark', 'animals', ['sea']),
  e('🐊', 'crocodile', 'animals', ['alligator']),
  e('🐘', 'elephant', 'animals', ['big']),
  e('🦒', 'giraffe', 'animals', ['tall']),
  e('🦓', 'zebra', 'animals', ['stripes']),
  e('🐄', 'cow', 'animals', ['farm']),
  e('🐑', 'ewe', 'animals', ['sheep']),
  e('🐐', 'goat', 'animals', ['farm']),
  e('🦌', 'deer', 'animals', ['forest']),
  e('🐕', 'dog', 'animals', ['pet']),
  e('🐈', 'cat', 'animals', ['pet']),
  e('🐓', 'rooster', 'animals', ['farm']),
  e('🦃', 'turkey', 'animals', ['thanksgiving']),
  e('🦜', 'parrot', 'animals', ['bird']),
  e('🐇', 'rabbit', 'animals', ['bunny']),
  e('🍎', 'red apple', 'food', ['fruit']),
  e('🍏', 'green apple', 'food', ['fruit']),
  e('🍐', 'pear', 'food', ['fruit']),
  e('🍊', 'tangerine', 'food', ['orange']),
  e('🍋', 'lemon', 'food', ['fruit']),
  e('🍌', 'banana', 'food', ['fruit']),
  e('🍉', 'watermelon', 'food', ['fruit']),
  e('🍇', 'grapes', 'food', ['fruit']),
  e('🍓', 'strawberry', 'food', ['fruit']),
  e('🫐', 'blueberries', 'food', ['fruit']),
  e('🍒', 'cherries', 'food', ['fruit']),
  e('🍑', 'peach', 'food', ['fruit']),
  e('🥭', 'mango', 'food', ['fruit']),
  e('🍍', 'pineapple', 'food', ['fruit']),
  e('🥥', 'coconut', 'food', ['fruit']),
  e('🥝', 'kiwi fruit', 'food', ['fruit']),
  e('🍅', 'tomato', 'food', ['vegetable']),
  e('🥑', 'avocado', 'food', ['vegetable']),
  e('🥦', 'broccoli', 'food', ['vegetable']),
  e('🥕', 'carrot', 'food', ['vegetable']),
  e('🌽', 'ear of corn', 'food', ['vegetable']),
  e('🌶️', 'hot pepper', 'food', ['spicy']),
  e('🥒', 'cucumber', 'food', ['vegetable']),
  e('🥬', 'leafy green', 'food', ['vegetable']),
  e('🍄', 'mushroom', 'food', ['fungus']),
  e('🧄', 'garlic', 'food', ['ingredient']),
  e('🧅', 'onion', 'food', ['ingredient']),
  e('🥔', 'potato', 'food', ['vegetable']),
  e('🍠', 'roasted sweet potato', 'food', ['vegetable']),
  e('🥐', 'croissant', 'food', ['bread']),
  e('🥯', 'bagel', 'food', ['bread']),
  e('🍞', 'bread', 'food', ['toast']),
  e('🥖', 'baguette bread', 'food', ['bread']),
  e('🥨', 'pretzel', 'food', ['snack']),
  e('🧀', 'cheese wedge', 'food', ['cheese']),
  e('🥚', 'egg', 'food', ['breakfast']),
  e('🍳', 'cooking', 'food', ['egg', 'breakfast']),
  e('🥞', 'pancakes', 'food', ['breakfast']),
  e('🧇', 'waffle', 'food', ['breakfast']),
  e('🥓', 'bacon', 'food', ['breakfast']),
  e('🍗', 'poultry leg', 'food', ['chicken']),
  e('🍖', 'meat on bone', 'food', ['meat']),
  e('🌭', 'hot dog', 'food', ['fast food']),
  e('🍔', 'hamburger', 'food', ['burger']),
  e('🍟', 'french fries', 'food', ['fast food']),
  e('🍕', 'pizza', 'food', ['fast food']),
  e('🥪', 'sandwich', 'food', ['lunch']),
  e('🌮', 'taco', 'food', ['mexican']),
  e('🌯', 'burrito', 'food', ['mexican']),
  e('🥙', 'stuffed flatbread', 'food', ['kebab']),
  e('🍝', 'spaghetti', 'food', ['pasta']),
  e('🍜', 'steaming bowl', 'food', ['ramen', 'noodles']),
  e('🍲', 'pot of food', 'food', ['stew']),
  e('🍛', 'curry rice', 'food', ['indian']),
  e('🍣', 'sushi', 'food', ['japanese']),
  e('🍱', 'bento box', 'food', ['japanese']),
  e('🥟', 'dumpling', 'food', ['asian']),
  e('🍤', 'fried shrimp', 'food', ['seafood']),
  e('🍙', 'rice ball', 'food', ['japanese']),
  e('🍚', 'cooked rice', 'food', ['rice']),
  e('🍥', 'fish cake with swirl', 'food', ['japanese']),
  e('🍢', 'oden', 'food', ['skewer']),
  e('🍡', 'dango', 'food', ['dessert']),
  e('🍧', 'shaved ice', 'food', ['dessert']),
  e('🍨', 'ice cream', 'food', ['dessert']),
  e('🍦', 'soft ice cream', 'food', ['dessert']),
  e('🥧', 'pie', 'food', ['dessert']),
  e('🧁', 'cupcake', 'food', ['dessert']),
  e('🎂', 'birthday cake', 'food', ['dessert']),
  e('🍰', 'shortcake', 'food', ['dessert']),
  e('🍮', 'custard', 'food', ['dessert']),
  e('🍭', 'lollipop', 'food', ['candy']),
  e('🍬', 'candy', 'food', ['sweet']),
  e('🍫', 'chocolate bar', 'food', ['sweet']),
  e('🍿', 'popcorn', 'food', ['snack', 'movie']),
  e('🍩', 'doughnut', 'food', ['donut']),
  e('🍪', 'cookie', 'food', ['biscuit']),
  e('☕', 'hot beverage', 'food', ['coffee', 'tea']),
  e('🍵', 'teacup without handle', 'food', ['tea']),
  e('🧃', 'beverage box', 'food', ['juice']),
  e('🥤', 'cup with straw', 'food', ['soda']),
  e('🍺', 'beer mug', 'food', ['drink']),
  e('🍻', 'clinking beer mugs', 'food', ['cheers']),
  e('🥂', 'clinking glasses', 'food', ['toast']),
  e('🍷', 'wine glass', 'food', ['drink']),
  e('🥃', 'tumbler glass', 'food', ['whiskey']),
  e('🍸', 'cocktail glass', 'food', ['drink']),
  e('🍹', 'tropical drink', 'food', ['cocktail']),
  e('🚗', 'automobile', 'travel', ['car', 'red']),
  e('🚕', 'taxi', 'travel', ['car']),
  e('🚙', 'sport utility vehicle', 'travel', ['car']),
  e('🚌', 'bus', 'travel', ['transport']),
  e('🚎', 'trolleybus', 'travel', ['bus']),
  e('🏎️', 'racing car', 'travel', ['fast']),
  e('🚓', 'police car', 'travel', ['cop']),
  e('🚑', 'ambulance', 'travel', ['emergency']),
  e('🚒', 'fire engine', 'travel', ['emergency']),
  e('🚐', 'minibus', 'travel', ['van']),
  e('🚚', 'delivery truck', 'travel', ['shipping']),
  e('🚛', 'articulated lorry', 'travel', ['truck']),
  e('🚜', 'tractor', 'travel', ['farm']),
  e('🛴', 'kick scooter', 'travel', ['scooter']),
  e('🚲', 'bicycle', 'travel', ['bike']),
  e('🛵', 'motor scooter', 'travel', ['vespa']),
  e('🏍️', 'motorcycle', 'travel', ['bike']),
  e('✈️', 'airplane', 'travel', ['flight']),
  e('🛫', 'airplane departure', 'travel', ['takeoff']),
  e('🛬', 'airplane arrival', 'travel', ['landing']),
  e('🚀', 'rocket', 'travel', ['launch', 'space']),
  e('🛸', 'flying saucer', 'travel', ['ufo']),
  e('🚁', 'helicopter', 'travel', ['fly']),
  e('⛵', 'sailboat', 'travel', ['boat']),
  e('🚤', 'speedboat', 'travel', ['boat']),
  e('🛳️', 'passenger ship', 'travel', ['cruise']),
  e('🚢', 'ship', 'travel', ['boat']),
  e('⚓', 'anchor', 'travel', ['ship']),
  e('🚧', 'construction', 'travel', ['barrier', 'wip']),
  e('⛽', 'fuel pump', 'travel', ['gas']),
  e('🚏', 'bus stop', 'travel', ['transport']),
  e('🚦', 'vertical traffic light', 'travel', ['signal']),
  e('🗺️', 'world map', 'travel', ['map']),
  e('🗿', 'moai', 'travel', ['statue', 'easter island']),
  e('🗽', 'Statue of Liberty', 'travel', ['new york']),
  e('🗼', 'Tokyo tower', 'travel', ['japan']),
  e('🏰', 'castle', 'travel', ['fortress']),
  e('🏯', 'Japanese castle', 'travel', ['fortress']),
  e('🎡', 'ferris wheel', 'travel', ['fair']),
  e('🎢', 'roller coaster', 'travel', ['theme park']),
  e('🎠', 'carousel horse', 'travel', ['fair']),
  e('⛲', 'fountain', 'travel', ['water']),
  e('🏖️', 'beach with umbrella', 'travel', ['holiday']),
  e('🏝️', 'desert island', 'travel', ['holiday']),
  e('🏔️', 'snow-capped mountain', 'travel', ['hike']),
  e('⛰️', 'mountain', 'travel', ['nature']),
  e('🌋', 'volcano', 'travel', ['eruption']),
  e('🏕️', 'camping', 'travel', ['tent']),
  e('🏠', 'house', 'travel', ['home']),
  e('🏡', 'house with garden', 'travel', ['home']),
  e('🏢', 'office building', 'travel', ['work']),
  e('🏭', 'factory', 'travel', ['industry']),
  e('🏥', 'hospital', 'travel', ['health']),
  e('🏦', 'bank', 'travel', ['money']),
  e('🏨', 'hotel', 'travel', ['stay']),
  e('🏪', 'convenience store', 'travel', ['shop']),
  e('🏫', 'school', 'travel', ['education']),
  e('🏬', 'department store', 'travel', ['shop']),
  e('💒', 'wedding', 'travel', ['marriage']),
  e('🏛️', 'classical building', 'travel', ['museum']),
  e('⛪', 'church', 'travel', ['religion']),
  e('🕌', 'mosque', 'travel', ['religion']),
  e('🕍', 'synagogue', 'travel', ['religion']),
  e('💡', 'light bulb', 'objects', ['idea']),
  e('🔦', 'flashlight', 'objects', ['torch']),
  e('🕯️', 'candle', 'objects', ['light']),
  e('🧯', 'fire extinguisher', 'objects', ['safety']),
  e('🧨', 'firecracker', 'objects', ['fireworks']),
  e('✨', 'sparkles', 'objects', ['magic', 'new']),
  e('🎈', 'balloon', 'objects', ['party']),
  e('🎉', 'party popper', 'objects', ['celebrate']),
  e('🎊', 'confetti ball', 'objects', ['celebrate']),
  e('🎆', 'fireworks', 'objects', ['celebrate']),
  e('🧧', 'red envelope', 'objects', ['lucky']),
  e('🎁', 'wrapped gift', 'objects', ['present']),
  e('🎀', 'ribbon', 'objects', ['bow']),
  e('🎟️', 'admission tickets', 'objects', ['event']),
  e('🎫', 'ticket', 'objects', ['event']),
  e('🎬', 'clapper board', 'objects', ['movie']),
  e('📱', 'mobile phone', 'objects', ['smartphone']),
  e('💻', 'laptop', 'objects', ['computer', 'code']),
  e('⌨️', 'keyboard', 'objects', ['typing']),
  e('🖥️', 'desktop computer', 'objects', ['monitor']),
  e('🖨️', 'printer', 'objects', ['print']),
  e('🖱️', 'computer mouse', 'objects', ['click']),
  e('💾', 'floppy disk', 'objects', ['save']),
  e('💿', 'optical disc', 'objects', ['cd']),
  e('📷', 'camera', 'objects', ['photo']),
  e('📸', 'camera with flash', 'objects', ['photo']),
  e('📹', 'video camera', 'objects', ['record']),
  e('🎥', 'movie camera', 'objects', ['film']),
  e('📞', 'telephone receiver', 'objects', ['call']),
  e('☎️', 'telephone', 'objects', ['call']),
  e('📺', 'television', 'objects', ['tv']),
  e('📻', 'radio', 'objects', ['audio']),
  e('🎙️', 'studio microphone', 'objects', ['podcast']),
  e('🧭', 'compass', 'objects', ['direction']),
  e('⏱️', 'stopwatch', 'objects', ['timer']),
  e('⏲️', 'timer clock', 'objects', ['timer']),
  e('⏰', 'alarm clock', 'objects', ['wake']),
  e('⌚', 'watch', 'objects', ['time']),
  e('📡', 'satellite antenna', 'objects', ['signal']),
  e('🔋', 'battery', 'objects', ['power']),
  e('🔌', 'electric plug', 'objects', ['power']),
  e('🧮', 'abacus', 'objects', ['calculate']),
  e('💰', 'money bag', 'objects', ['cash']),
  e('💴', 'yen banknote', 'objects', ['money']),
  e('💵', 'dollar banknote', 'objects', ['money']),
  e('💶', 'euro banknote', 'objects', ['money']),
  e('💷', 'pound banknote', 'objects', ['money']),
  e('💸', 'money with wings', 'objects', ['spend']),
  e('💳', 'credit card', 'objects', ['payment']),
  e('🧾', 'receipt', 'objects', ['invoice']),
  e('💎', 'gem stone', 'objects', ['diamond']),
  e('⚖️', 'balance scale', 'objects', ['justice']),
  e('🔧', 'wrench', 'objects', ['tool', 'fix']),
  e('🔨', 'hammer', 'objects', ['tool']),
  e('🛠️', 'hammer and wrench', 'objects', ['tools']),
  e('⚙️', 'gear', 'objects', ['settings']),
  e('🧱', 'brick', 'objects', ['build']),
  e('🧲', 'magnet', 'objects', ['attract']),
  e('🧪', 'test tube', 'objects', ['science', 'test']),
  e('🧬', 'DNA', 'objects', ['science']),
  e('🔭', 'telescope', 'objects', ['space']),
  e('🔬', 'microscope', 'objects', ['science']),
  e('📚', 'books', 'objects', ['library', 'read']),
  e('📖', 'open book', 'objects', ['read']),
  e('📝', 'memo', 'objects', ['note', 'write']),
  e('✏️', 'pencil', 'objects', ['write']),
  e('🖊️', 'pen', 'objects', ['write']),
  e('📌', 'pushpin', 'objects', ['pin']),
  e('📍', 'round pushpin', 'objects', ['location']),
  e('📎', 'paperclip', 'objects', ['attach']),
  e('📏', 'straight ruler', 'objects', ['measure']),
  e('📐', 'triangular ruler', 'objects', ['measure']),
  e('✂️', 'scissors', 'objects', ['cut']),
  e('🗂️', 'card index dividers', 'objects', ['files']),
  e('📁', 'file folder', 'objects', ['directory']),
  e('📂', 'open file folder', 'objects', ['directory']),
  e('🗄️', 'file cabinet', 'objects', ['archive']),
  e('📅', 'calendar', 'objects', ['date']),
  e('🗒️', 'spiral notepad', 'objects', ['notes']),
  e('📇', 'card index', 'objects', ['contacts']),
  e('📈', 'chart increasing', 'objects', ['growth']),
  e('📉', 'chart decreasing', 'objects', ['loss']),
  e('📊', 'bar chart', 'objects', ['stats']),
  e('📋', 'clipboard', 'objects', ['copy', 'tasks']),
  e('🔒', 'locked', 'objects', ['secure']),
  e('🔓', 'unlocked', 'objects', ['open']),
  e('🔐', 'locked with key', 'objects', ['secure']),
  e('🔑', 'key', 'objects', ['unlock']),
  e('🗝️', 'old key', 'objects', ['unlock']),
  e('❤️', 'red heart', 'symbols', ['love']),
  e('🧡', 'orange heart', 'symbols', ['love']),
  e('💛', 'yellow heart', 'symbols', ['love']),
  e('💚', 'green heart', 'symbols', ['love']),
  e('💙', 'blue heart', 'symbols', ['love']),
  e('💜', 'purple heart', 'symbols', ['love']),
  e('🖤', 'black heart', 'symbols', ['love']),
  e('🤍', 'white heart', 'symbols', ['love']),
  e('🤎', 'brown heart', 'symbols', ['love']),
  e('💔', 'broken heart', 'symbols', ['sad']),
  e('❣️', 'heart exclamation', 'symbols', ['love']),
  e('💕', 'two hearts', 'symbols', ['love']),
  e('💞', 'revolving hearts', 'symbols', ['love']),
  e('💓', 'beating heart', 'symbols', ['love']),
  e('💗', 'growing heart', 'symbols', ['love']),
  e('💖', 'sparkling heart', 'symbols', ['love']),
  e('💘', 'heart with arrow', 'symbols', ['cupid']),
  e('💝', 'heart with ribbon', 'symbols', ['gift']),
  e('💟', 'heart decoration', 'symbols', ['love']),
  e('☮️', 'peace symbol', 'symbols', ['hippie']),
  e('✝️', 'latin cross', 'symbols', ['religion']),
  e('☪️', 'star and crescent', 'symbols', ['islam']),
  e('🕉️', 'om', 'symbols', ['hindu']),
  e('☸️', 'wheel of dharma', 'symbols', ['buddhism']),
  e('✡️', 'star of David', 'symbols', ['judaism']),
  e('☯️', 'yin yang', 'symbols', ['balance']),
  e('☦️', 'orthodox cross', 'symbols', ['religion']),
  e('🛐', 'place of worship', 'symbols', ['religion']),
  e('♈', 'Aries', 'symbols', ['zodiac']),
  e('♉', 'Taurus', 'symbols', ['zodiac']),
  e('♊', 'Gemini', 'symbols', ['zodiac']),
  e('♋', 'Cancer', 'symbols', ['zodiac']),
  e('♌', 'Leo', 'symbols', ['zodiac']),
  e('♍', 'Virgo', 'symbols', ['zodiac']),
  e('♎', 'Libra', 'symbols', ['zodiac']),
  e('♏', 'Scorpio', 'symbols', ['zodiac']),
  e('♐', 'Sagittarius', 'symbols', ['zodiac']),
  e('♑', 'Capricorn', 'symbols', ['zodiac']),
  e('♒', 'Aquarius', 'symbols', ['zodiac']),
  e('♓', 'Pisces', 'symbols', ['zodiac']),
  e('⚛️', 'atom symbol', 'symbols', ['science']),
  e('☢️', 'radioactive', 'symbols', ['danger']),
  e('☣️', 'biohazard', 'symbols', ['danger']),
  e('📴', 'mobile phone off', 'symbols', ['silent']),
  e('📳', 'vibration mode', 'symbols', ['phone']),
  e('✴️', 'eight-pointed star', 'symbols', ['star']),
  e('🆚', 'VS button', 'symbols', ['versus']),
  e('💮', 'white flower', 'symbols', ['flower']),
  e('🉐', 'Japanese bargain button', 'symbols', ['deal']),
  e('㊙️', 'Japanese secret button', 'symbols', ['secret']),
  e('㊗️', 'Japanese congratulations button', 'symbols', ['congrats']),
  e('🅰️', 'A button', 'symbols', ['blood type']),
  e('🅱️', 'B button', 'symbols', ['blood type']),
  e('🆎', 'AB button', 'symbols', ['blood type']),
  e('🆑', 'CL button', 'symbols', ['clear']),
  e('🅾️', 'O button', 'symbols', ['blood type']),
  e('🆘', 'SOS button', 'symbols', ['help']),
  e('❌', 'cross mark', 'symbols', ['no', 'wrong']),
  e('⭕', 'hollow red circle', 'symbols', ['correct']),
  e('🛑', 'stop sign', 'symbols', ['stop']),
  e('⛔', 'no entry', 'symbols', ['forbidden']),
  e('📛', 'name badge', 'symbols', ['badge']),
  e('🚫', 'prohibited', 'symbols', ['no']),
  e('💯', 'hundred points', 'symbols', ['perfect']),
  e('💢', 'anger symbol', 'symbols', ['angry']),
  e('♨️', 'hot springs', 'symbols', ['onsen']),
  e('🚷', 'no pedestrians', 'symbols', ['forbidden']),
  e('🚭', 'no smoking', 'symbols', ['forbidden']),
  e('🚳', 'no bicycles', 'symbols', ['forbidden']),
  e('🚱', 'non-potable water', 'symbols', ['no water']),
  e('🔞', 'no one under eighteen', 'symbols', ['adult']),
  e('📵', 'no mobile phones', 'symbols', ['forbidden']),
  e('🚯', 'no littering', 'symbols', ['forbidden']),
  e('🚮', 'litter in bin sign', 'symbols', ['trash']),
  e('🎐', 'wind chime', 'symbols', ['japan']),
  e('🎏', 'carp streamer', 'symbols', ['japan']),
  e('🎎', 'Japanese dolls', 'symbols', ['japan']),
  e('🎍', 'pine decoration', 'symbols', ['new year']),
  e('🎋', 'tanabata tree', 'symbols', ['japan']),
  e('🎃', 'jack-o-lantern', 'symbols', ['halloween']),
  e('🎄', 'Christmas tree', 'symbols', ['holiday']),
];

const fallbackCopy = (value: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const codePoints = (value: string) =>
  Array.from(value)
    .map((character) => {
      const code = character.codePointAt(0);
      return code
        ? `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
        : '';
    })
    .filter(Boolean)
    .join(' ');

export default function EmojiPicker() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | EmojiCategory>('all');
  const [selected, setSelected] = useState<EmojiEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return EMOJIS.filter((emoji) => {
      if (category !== 'all' && emoji.category !== category) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        emoji.name.toLowerCase().includes(search) ||
        emoji.char.includes(search) ||
        emoji.keywords.some((keyword) => keyword.toLowerCase().includes(search))
      );
    });
  }, [query, category]);

  const copyEmoji = async (emoji: EmojiEntry) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(emoji.char);
      } else {
        fallbackCopy(emoji.char);
      }
    } catch {
      fallbackCopy(emoji.char);
    }
    setSelected(emoji);
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Find an emoji">
            <Field
              hint={`${filtered.length} of ${EMOJIS.length}`}
              htmlFor="emoji-search"
              label="Search by name or keyword"
            >
              <Input
                id="emoji-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="smile, rocket, heart…"
                value={query}
              />
            </Field>

            <Field className="mt-4" htmlFor="emoji-category" label="Category">
              <Select
                id="emoji-category"
                onChange={(event) =>
                  setCategory(event.target.value as 'all' | EmojiCategory)
                }
                value={category}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            {selected ? (
              <Callout
                className="mt-4"
                title={copied ? 'Copied to clipboard' : 'Selected emoji'}
                variant={copied ? 'success' : 'info'}
              >
                <span className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl leading-none">{selected.char}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">
                      {selected.name}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {codePoints(selected.char)}
                    </span>
                  </span>
                  {copied && (
                    <Check
                      aria-hidden
                      className="ml-auto h-4 w-4 text-success"
                    />
                  )}
                </span>
              </Callout>
            ) : (
              <Callout className="mt-4" variant="info">
                Click any emoji to copy it. Your browser handles the clipboard
                locally.
              </Callout>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="accent">{EMOJIS.length} emojis</Badge>
              <Badge>{CATEGORIES.length} categories</Badge>
              <CopyButton
                className="ml-auto"
                label="Copy selected"
                value={selected?.char ?? ''}
              />
            </div>

            {selected && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selected.keywords.map((keyword) => (
                  <Badge key={keyword}>{keyword}</Badge>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel
          description="Click an emoji to copy the character to the clipboard."
          title="Emoji grid"
        >
          {filtered.length === 0 ? (
            <EmptyState
              description="Try a different keyword or switch to another category."
              icon={Search}
              title="No emojis found"
            />
          ) : (
            <div className="grid max-h-[560px] grid-cols-6 gap-1.5 overflow-auto pr-1 sm:grid-cols-8">
              {filtered.map((emoji) => (
                <button
                  aria-label={`Copy ${emoji.name}`}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-canvas-subtle/40 text-2xl transition-colors hover:border-accent hover:bg-accent-subtle/20"
                  key={`${emoji.char}-${emoji.name}`}
                  onClick={() => void copyEmoji(emoji)}
                  title={`${emoji.name} — click to copy`}
                  type="button"
                >
                  <span aria-hidden>{emoji.char}</span>
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            The list is curated and built in, so no network requests are made.
            Some combinations may render differently depending on your operating
            system.
          </p>
        </Panel>
      </ToolLayout>
    </div>
  );
}
