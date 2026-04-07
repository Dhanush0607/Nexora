//AES-256-CBC encryption and decryption for all sensitive data

const crypto = require('crypto');

//algorithm and key setup
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.AES_SECRET_KEY; //MUST BE 32 CHARACTERS
const KEY_BUFFER = Buffer.from(SECRET_KEY);//convert to buffer


const EncryptionService = {

    //Encryption plain text -> returns {iv ,ciphertext}
    //call this before saving any sensitive data to mongoDB
    encrypt(plainText){
        //Generate a random IV for every encryption
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM,KEY_BUFFER,iv);
        let ciphertext = cipher.update(String(plainText),'utf8','hex');
        ciphertext += cipher.final('hex');

        return{
            iv : iv.toString('hex'), //store this in mongoDB
            ciphertext:ciphertext, // store this in mongoDB
        };
    },

    //Decrypts {iv,ciphertext}-> returns plain text
    //call this when showing data to varified scanner
    decrypt(iv,ciphertext){
        const ivBuffer = Buffer.from(iv,'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM,KEY_BUFFER,ivBuffer);
        let plainText = decipher.update(ciphertext,'hex','utf8');
        plainText += decipher.final('utf8');
        return plainText;
    },
 };

 module.exports = EncryptionService;