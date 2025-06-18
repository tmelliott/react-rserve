FROM rocker/r-ver:4.4

# Install Rserve packages
RUN R -e "install.packages('Rserve')"

RUN R -e "install.packages('remotes')"
RUN R -e "remotes::install_github('tmelliott/ts@develop')"

COPY src/rserve rserve
# RUN R -e 'system("grep -o \"[a-zA-Z]*::\" rserve/demo.R | grep -o \"[a-zA-Z]*\" | sort | uniq", intern = TRUE) |> pak::pak()'

# compile
RUN Rscript -e 'ts::ts_compile("rserve/demo.R"); ts::ts_deploy("rserve/demo.R")'

CMD ["Rscript", "rserve/demo.rserve.R"]
