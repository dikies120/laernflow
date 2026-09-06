const { getConnection } = require('../config/db');

class MateriModel {
  static async getAllMateri() {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS, ORDER_INDEX 
         FROM MATERI 
         ORDER BY KELAS ASC, NAMA_MATERI ASC, ORDER_INDEX ASC`
      );
      return result.rows;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async createMateri(data) {
    let conn;
    try {
      conn = await getConnection();
      const idResult = await conn.execute(`SELECT MATERI_SEQ.NEXTVAL AS ID FROM DUAL`);
      const id = idResult.rows[0].ID;

      const sql = `INSERT INTO MATERI (ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS, ORDER_INDEX)
                   VALUES (:id, :kelas, :nama_materi, :link_youtube_val, :tipe_materi, :link_dokumen_val, :isi_teks_val, :order_index_val)`;
      
      const orderIndexVal = (data.order_index !== undefined && data.order_index !== null && data.order_index.toString().trim() !== '') ? parseInt(data.order_index) : null;

      await conn.execute(sql, {
          id,
          kelas: data.kelas,
          nama_materi: data.nama_materi,
          link_youtube_val: data.link_youtube_val,
          tipe_materi: data.tipe_materi,
          link_dokumen_val: data.link_dokumen_val, 
          isi_teks_val: data.isi_teks_val,
          order_index_val: orderIndexVal 
        },
        { autoCommit: true }
      );
      return id;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async getMateriById(id) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT LINK_DOKUMEN FROM MATERI WHERE ID = :id`,
        { id }
      );
      return result.rows[0];
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async deleteMateri(id) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `DELETE FROM MATERI WHERE ID = :id`,
        { id },
        { autoCommit: true }
      );
      return result.rowsAffected > 0;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }
}

module.exports = MateriModel;
