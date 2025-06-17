FROM r-base:latest

# Install R packages
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev
RUN R -e "install.packages('pak'); print(.libPaths())"
RUN R -e "pak::pkg_install('Rserve')"

COPY scripts scripts
RUN R -e 'system("grep -o \"[a-zA-Z]*::\" scripts/app_functions.R | grep -o \"[a-zA-Z]*\" | sort | uniq", intern = TRUE) |> pak::pak()'

COPY server server
COPY Data Data

# compile
RUN Rscript -e 'ts::ts_compile(\"src/rserve/demo.R\"); ts::ts_deploy(\"src/rserve/demo.R\")'

CMD ["Rscript", "src/rserve/demo.rserve.R"]
