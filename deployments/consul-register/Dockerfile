FROM alpine:latest

RUN apk add --no-cache curl bash

WORKDIR /app

COPY register-services.sh /app/register-services.sh
RUN chmod +x /app/register-services.sh

CMD ["/app/register-services.sh"]

