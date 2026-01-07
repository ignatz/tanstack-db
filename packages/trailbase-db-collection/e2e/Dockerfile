FROM trailbase/trailbase:latest

USER root
WORKDIR /app

COPY traildepot /app/traildepot/

RUN chown -R trailbase:trailbase /app/traildepot && \
    chmod -R 777 /app/traildepot

EXPOSE 4000

USER trailbase
CMD ["/app/trail", "--data-dir", "/app/traildepot", "run", "--address", "0.0.0.0:4000"]
