const fs = require('fs');

const convertFile = (inputFile, outputFile, descriptions = {}) => {
    const content = fs.readFileSync(inputFile, 'utf-8');
    const words = content.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    const jsonOutput = words.map(word => ({
        word: word,
        description: descriptions[word] || `Definition for ${word}`
    }));
    fs.writeFileSync(outputFile, JSON.stringify(jsonOutput, null, 2));
    console.log(`Converted ${inputFile} to ${outputFile}`);
};

// Example descriptions for first few words (I will try to provide more)
const azDescriptions = {
    "abidə": "Monument və ya xatirə nümunəsi",
    "abort": "Hamiləliyin dayandırılması",
    "açığı": "Düzünü desəm, səmimi olaraq",
    "açılış": "Bir şeyin başladılması mərasimi",
    "açıq-aşkar": "Tamamilə aydın olan",
    "açıq-aydın": "Şübhəsiz, görünən",
    "açıqlama": "İzahat və ya bəyanat",
    "açıqlamaq": "İzah etmək, bəyan etmək",
    "açıq şəkildə": "Səmimi və gizlətmədən",
    "aclıq": "Yeməksiz qalma halı",
    "açmaq": "Bağlı olanı sərbəst buraxmaq",
    "addım": "Yeriş zamanı atılan hərəkət",
    "adekvat": "Uyğun, münasib",
    "adətən": "Hər zaman olduğu kimi, tez-tez",
    "Ad günü": "Doğum tarixi münasibətilə qeyd edilən gün"
};

const enDescriptions = {
    "abandon": "To leave behind or give up on",
    "abandoned": "Left alone or deserted",
    "abate": "To become less intense or widespread",
    "abatement": "The reduction or lessening of something",
    "abdomen": "The part of the body containing the stomach",
    "abdominal": "Relating to the abdomen",
    "aberration": "A departure from what is normal",
    "abide": "To accept or act in accordance with",
    "ability": "The power or skill to do something",
    "abnormal": "Deviating from what is normal or typical",
    "abode": "A place of residence; a house or home",
    "abortion": "The termination of a pregnancy",
    "abortive": "Failing to produce the intended result",
    "abounding": "Existing in large numbers or amounts",
    "about": "On the subject of; concerning",
    "above": "At a higher level or layer than"
};

convertFile('/home/x/Documents/Projects/az_freestyle_random_word_generator/data/AZ.txt', '/home/x/Documents/Projects/az_freestyle_random_word_generator/data/AZ.json', azDescriptions);
convertFile('/home/x/Documents/Projects/az_freestyle_random_word_generator/data/EN.txt', '/home/x/Documents/Projects/az_freestyle_random_word_generator/data/EN.json', enDescriptions);
