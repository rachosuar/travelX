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
  -Crear metadata pasaje para practica

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

// Declarar las address de TravelX y Aerolinea

// Funcion de poner en venta un pasaje (un usuario X)
// Input deberia ser el ID del NFT - Precio de venta que pone
// Verificar que sea el owner
// Setear el precio al cual lo quiere vender
// Ver que esté dentro de tiempo (entiendo que hasta 3 días antes del vuelo)

// Función de comprar un pasaje
// Input el ID del NFT
// El comprador envia el $ (USDT, ETH, MATIC o lo que sea)
// Payment Splitter --> configurar que el 2 % va a travelX y 3% a la compañia aerea
// EL 95% restante al vendedor
// El NFT pasa a la address del comprador
// Emitir evento de transferencia
