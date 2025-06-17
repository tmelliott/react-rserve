FROM r-base:latest

# Install R packages
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev
RUN R -e "install.packages('pak'); print(.libPaths())"
RUN R -e "pak::pkg_install('Rserve')"

COPY src/rserve rserve
RUN R -e 'system("grep -o \"[a-zA-Z]*::\" rserve/demo.R | grep -o \"[a-zA-Z]*\" | sort | uniq", intern = TRUE) |> pak::pak()'

# compile
RUN Rscript -e 'ts::ts_compile(\"rserve/demo.R\"); ts::ts_deploy(\"rserve/demo.R\")'

CMD ["Rscript", "rserve/demo.rserve.R"]
