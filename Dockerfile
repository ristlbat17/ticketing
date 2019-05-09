FROM node:8-jessie

RUN mkdir -p /app && \
    apt-get update && \
    apt-get install -y dos2unix && \
    apt-get install -y --no-install-recommends bsdtar

WORKDIR /usr/bin
# Install entrypoint
COPY entrypoint.sh entrypoint.sh
RUN chmod 777 entrypoint.sh && \
    dos2unix entrypoint.sh 

COPY build.sh build.sh
RUN chmod 777 build.sh && \
    dos2unix build.sh

COPY meteor.sh meteor.sh
RUN chmod 777 meteor.sh&& \
    dos2unix meteor.sh

RUN echo "Install meteor ..."
RUN sh meteor.sh

COPY . /app/src

RUN /bin/bash build.sh

EXPOSE 80

CMD ["/usr/bin/entrypoint.sh"]
