SELECT 
    "Email", 
    "Salt", 
    encode("PasswordHash", 'hex') as "PasswordHashHex", 
    length("PasswordHash") as "HashLength",
    length("Salt") as "SaltLength"
FROM "Users" 
WHERE "Email" = 'test@example.com';

