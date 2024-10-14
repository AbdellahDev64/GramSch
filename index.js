const express = require("express");

const app = express()
const port = 8080


app.get('/', (req, res) => {
    res.send('I\'m Live :)')
})
app.listen(port, () => {
    console.log(`I'm Live in ${port} :)`)
})


const axios = require("axios")
const { Client, LocalAuth } = require('whatsapp-web.js');

function decimalFixed(decimal) {
    return decimal.toFixed(3)
}

function GramSchmidt(Matrixes) {
    const matrixA = Matrixes.map(v => v.vecteur_coords);
    const n = matrixA[0].length; // Assume all vectors have the same dimension
    const totalVectors = matrixA.length;

    for (var i = 0; i < totalVectors; i++) {
        var tempVector = matrixA[i];
        for (var j = 0; j < i; j++) {
            var dotProd = dot(tempVector, matrixA[j], n);
            var toSubtract = multiply(dotProd, matrixA[j], n);
            tempVector = subtract(tempVector, toSubtract, n);
        }
        var nrm = norm(tempVector, n);
        matrixA[i] = multiply(1 / nrm, tempVector, n).map(m => decimalFixed(m));
    }

    return matrixA
}

/* Simple vector arithmetic functions */

function subtract(vectorX, vectorY, n) {
    var result = new Array(n);
    for (var i = 0; i < n; i++)
        result[i] = vectorX[i] - vectorY[i];
    return result;
}

function multiply(scalarC, vectorX, n) {
    var result = new Array(n);
    for (var i = 0; i < n; i++)
        result[i] = scalarC * vectorX[i];
    return result;
}

function dot(vectorX, vectorY, n) {
    var sum = 0;
    for (var i = 0; i < n; i++)
        sum += vectorX[i] * vectorY[i];
    return sum;
}

function norm(vectorX, n) {
    return Math.sqrt(dot(vectorX, vectorX, n));
}

const client = new Client({
    puppeteer: {
        headless:true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth()
});
console.log("Starting whatsapp bot...")
client.initialize()

client.on("qr", qr => {
    console.log(qr)
})

client.on('ready', () => {
    console.log("Whatsapp API is ready!")
})


let garabage = []
function isString(value) {
    return typeof value === 'string';
}
client.on('message_create', async (message) => {
    if (message.body && isString(message.body) && message.body.startsWith('!abdellah')) {
        //Get Sender Data
        const senderId = message.from;
        const contact = await client.getContactById(senderId);
        const senderName = contact.pushname || contact.notifyName || contact.name || senderId;
        //LOGIC
        var sentMessage;
        const content = message.body.split("!abdellah")[1]
        var trimed_content = content.trim()
        if (trimed_content == "help") {
            message.react('💡')
            sentMessage = await message.reply(`Bonjour @${senderName}, je suis le Bot *Gram-Schmidt* dévelopé par *Abdellah El Idrissi* ! 👋\n-> Le bot peut extraire les vecteurs à partir de l\'énoncé et appliquer l'Algorithme de Gram-Schmidt.\n   Le Bot peut trouver une B.O.N à la fois.\n   Utilise cette commande :\n- *!abdellah 'l\'énoncé de l\'exercice'*\n\n-> Utilise cette commande pour supprimer tous les messages envoyés par le bot\n- *!abdellah clean*\n\n-> Utilise cette commande pour obtenir de l\'aide.\n- *!abdellah help*`)
            garabage.push(sentMessage.id);
        }
        else if (trimed_content == "clean") {
            if (garabage.length > 0) {
                for (const msgId of garabage) {
                    try {
                        await client.sendMessage(message.from, { delete: msgId });
                    } catch (error) {
                        console.error(`Failed to delete message with ID ${msgId}: ${error.message}`);
                    }
                }
                message.reply("Tous les messages ont été supprimés ! 🗑️");
            }
        }
        else if (trimed_content == "") {
            message.react('👋')
            sentMessage = message.reply(`Bonjour @${senderName}👋\nEnvoie-moi tes vecteurs, et je te renverrai une base orthonormée (B.O.N) après traitement. 🚀`);
            garabage.push(sentMessage.id);
        } else {
            message.react('⏳')
            sentMessage = message.reply(`@${senderName}! Votre énoncé est en cours de traitement... ⏳`)
            garabage.push(sentMessage.id);
            await axios(`https://poeapi-vectextractor.onrender.com/api/get_vectors?message=${trimed_content}`)
                .then(async (response) => {
                    if (response.status == 200) {
                        const data = JSON.parse(response.data);
                        const vecteurs = data["vectors"];
                        if (Array.isArray(vecteurs) && vecteurs.length > 1 && vecteurs.every(vecteur => vecteur.vecteur_coords.length === vecteurs.length)) {
                            let vecteursMessage = "• 📏Les vecteurs détectés sont :\n";

                            vecteurs.forEach(vecteur => {
                                const vecteurId = vecteur.vecteur_id;
                                const vecteurCoords = vecteur.vecteur_coords.join(',');
                                vecteursMessage += `- *Vecteur ${vecteurId + 1}* de coordonnées *(${vecteurCoords})*\n`;
                            });
                            vecteursMessage += "• 📐Dimension : *" + vecteurs.length.toString() + "*"
                            sentMessage = message.reply(vecteursMessage);
                            garabage.push(sentMessage.id);

                            const zeroVectors = vecteurs.filter(vecteur =>
                                vecteur.vecteur_coords.every(coord => coord === 0)
                            );

                            if (zeroVectors.length <= 0) {
                                sentMessage = message.reply(`@${senderName}! Appliquons le *Gram-Schmidt* aux vecteurs trouvés... ⏳`);
                                garabage.push(sentMessage.id);
                                try {
                                    const base_orthonormal = GramSchmidt(vecteurs);
                                    var i = 0
                                    var res = `C\'est fini ${senderName}! 🎉\n\nLes vecteurs formant une B.O.N. en appliquant l\'algorithme de Gram-Schmidt sont : `;
                                    base_orthonormal.forEach(v => {
                                        res += `\n\t• Vecteur e_${i + 1} de coordonnées (${v.join(', ')})`
                                        i++
                                    })
                                    res += '\n\nNous vous remercions d\'avoir utilisé notre bot! 😊'
                                    message.react('✅');

                                    sentMessage = message.reply(res)
                                    garabage.push(sentMessage.id);
                                } catch (ex) {
                                    message.react('❌');

                                    sentMessage = message.reply(`Erreur : Impossible de appliquer *Gram-Schmidt* sur ces vecteurs. Veuillez vérifier votre énoncé et réessayer. 😞`);
                                    garabage.push(sentMessage.id);
                                }
                            } else {
                                message.react('❌');
                                sentMessage = message.reply(`Erreur : L'algorithme de Gram-Schmidt ne peut pas produire une B.O.N car l'un des vecteurs fournis est nul. 😞`);
                                garabage.push(sentMessage.id);
                            }
                        } else {
                            message.react('❌');
                            sentMessage = message.reply(`Erreur: Les vecteurs ne sont pas valides ou manquants. 😢`);
                            garabage.push(sentMessage.id);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Erreur lors de la requête :', error);
                    message.react('❌');
                    sentMessage = message.reply('Erreur lors de l\'extraction des vecteurs. 😢');
                    garabage.push(sentMessage.id);
                });
        }

    }
});


