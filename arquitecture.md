** crear,testear y deployar un smart contract para hacer transferencias descentralizadas de un NFTicket entre dos wallets,pagando fees por la transferencia.**

Crear un smart contract: + transferencias entre terceros pagando comision + deployado en mumbai

- transferencia de un NFTicket de forma descentralizada entre 2 wallets (ERC-721)
- debe pagar un fee por la transferencia en cuestión que equivale al 5% del costo del NFTicket. (Royaltis)
- De dicho porsentaje el 2% para travelX y el 3% para la aerolinea emisora. (Payment Spliter)
- declarando las variables de estado de la aerolínea emisora, como así también de TravelX. Usa una address mock para ambas
- Verificar que el vendedor sea el dueño del NFT.
- La funcion transfer debe indicar el precio mas el fee.
  -Emitir un evento por transferencia.
- Hacer testeos y deploy
- Conectar a la testnet.

              NFTTicket
                  |
              sell ticket
                  |
                 / \
            seller  fee (royalty)
                        |
                    payment splitter
                          |
                         / \
                  travelX   airline
