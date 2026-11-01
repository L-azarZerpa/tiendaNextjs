'use server';

export async function verifyRecaptcha(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.error('Error: FALTA LA VARIABLE RECAPTCHA_SECRET_KEY');
        return false;
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();

        // data.score va de 0.0 (bot) a 1.0 (humano). 0.5 es el estándar recomendado.
        return data.success && data.score >= 0.5;
    } catch (error) {
        console.error('Error verificando reCAPTCHA:', error);
        return false;
    }
}