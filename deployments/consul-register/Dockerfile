FROM alpine:3.18

RUN apk add --no-cache curl bash dos2unix

WORKDIR /app

COPY register-services.sh ./

RUN dos2unix register-services.sh || sed -i 's/\r$//' register-services.sh && \
    chmod +x register-services.sh

CMD ["bash", "/app/register-services.sh"]

